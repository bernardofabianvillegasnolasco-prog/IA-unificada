# Proyecto de IA Unificada

Base local para coordinar varias IAs con memoria y registro verificable.

## Estructura

- `Carpeta/`: documento de incorporación y contexto del proyecto.
- `config/`: configuración no secreta de proveedores y agentes.
- `integrations/`: adaptadores para APIs y servicios externos.
- `memory/`: memoria curada y conclusiones verificadas.
- `logs/`: registro de ejecuciones, decisiones y evidencias.
- `src/`: código de la aplicación unificada.
- `tests/`: pruebas.

## Preparación

1. Copia `.env.example` como `.env`.
2. Completa únicamente las variables de los proveedores que vayas a usar.
3. No subas `.env` ni claves a GitHub.
4. Conserva en `memory/` solo información útil y autorizada.
5. Registra cada resultado importante con objetivo, evidencia, certeza,
   limitaciones y propuesta.

La configuración inicial de proveedores está en `config/providers.json`:
OpenAI es el proveedor principal (`gpt-5`) y Anthropic/Google son respaldos.
Las claves se deben proporcionar mediante `.env`, nunca dentro de JSON,
Markdown o código.

## Estado actual

La carpeta original contiene el documento
`Carpeta/ARCHIVO_UNICO_PROYECTO_EL_EQUIPO.md`. Esta base no afirma que haya
conexiones externas activas: esas conexiones requieren configurar proveedores,
credenciales y permisos explícitos.
