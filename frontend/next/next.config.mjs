/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true
  },
  // Configuración para permitir imágenes externas si las necesitas
  images: {
    domains: ['localhost'],
  }
}

export default nextConfig;
