# core/utils/rut.py
import re

_RUT_CLEAN_RE = re.compile(r"[^0-9kK]")

def _compute_dv(num_str: str) -> str:
    """Calcula DV con módulo 11. num_str: solo dígitos."""
    reversed_digits = map(int, reversed(num_str))
    factors = [2, 3, 4, 5, 6, 7]
    s = 0
    i = 0
    for d in reversed_digits:
        s += d * factors[i % len(factors)]
        i += 1
    r = 11 - (s % 11)
    if r == 11:
        return "0"
    if r == 10:
        return "K"
    return str(r)

def clean_and_split(rut_raw: str) -> tuple[str, str]:
    """Limpia (quita puntos/espacios/guiones), retorna (cuerpo, DV). Lanza ValueError si inválido."""
    if not rut_raw or not isinstance(rut_raw, str):
        raise ValueError("RUT vacío")
    txt = _RUT_CLEAN_RE.sub("", rut_raw).upper()  # deja solo [0-9K]
    if len(txt) < 2:
        raise ValueError("RUT demasiado corto")
    body, dv = txt[:-1], txt[-1]
    if not body.isdigit():
        raise ValueError("Cuerpo no numérico")
    if len(body) > 8:
        raise ValueError("Cuerpo demasiado largo")
    return body, dv

def is_valid_rut(rut_raw: str) -> bool:
    try:
        body, dv = clean_and_split(rut_raw)
        return _compute_dv(body) == dv
    except Exception:
        return False

def normalize_rut(rut_raw: str) -> str:
    """Devuelve 'XXXXXXXX-D' (sin puntos). Lanza ValueError si inválido."""
    body, dv = clean_and_split(rut_raw)
    if _compute_dv(body) != dv:
        raise ValueError("DV incorrecto")
    return f"{int(body)}-{dv}"  # int() quita ceros a la izquierda
