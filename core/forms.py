# core/forms.py
from django import forms

TYPE_CHOICES = (
    ("compras", "Compras"),
    ("ventas", "Ventas"),
)

MAX_FILE_MB = 15
ALLOWED_EXTS = {".csv"}

def _validate_file(f: forms.FileField):
    import os
    name = f.name.lower()
    ext = os.path.splitext(name)[1]
    if ext not in ALLOWED_EXTS:
        raise forms.ValidationError("Solo se acepta formato .csv")
    size_mb = f.size / (1024 * 1024)
    if size_mb > MAX_FILE_MB:
        raise forms.ValidationError(f"El archivo excede {MAX_FILE_MB} MB")

class FormCreateForm(forms.Form):
    rut_slot_id = forms.UUIDField(widget=forms.HiddenInput, required=True)
    rut_slot_display = forms.CharField(widget=forms.Select, required=True)  # usado solo para render (overridden en la view)
    sii_password = forms.CharField(
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password"}),
        required=True,
        label="Contraseña SII",
    )
    type = forms.ChoiceField(choices=TYPE_CHOICES, required=True, label="Tipo")
    csv_33 = forms.FileField(required=True, label="CSV 33")
    csv_46 = forms.FileField(required=True, label="CSV 46")

    def clean_csv_33(self):
        f = self.cleaned_data["csv_33"]
        _validate_file(f)
        return f

    def clean_csv_46(self):
        f = self.cleaned_data["csv_46"]
        _validate_file(f)
        return f
