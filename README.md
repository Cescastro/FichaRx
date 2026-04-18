# Prototipo — Manual de Medicamentos FO-SF-20

Prototipo navegable para validar la UX del buscador y la ficha unificada antes
de invertir en backend y stack completo.

## Contenido

- **prototipo_standalone.html** — ⭐ Versión todo-en-uno. Ábrelo con doble clic
  en cualquier navegador. Funciona sin servidor ni internet.

- **index.html + dataset_final.json + sw.js + manifest.webmanifest** — Versión
  PWA real. Requiere servidor local (abajo cómo levantarlo). Es la que debería
  ir a producción.

## Cómo probar

### Opción A — Rápida (sin instalar nada)
Abre `prototipo_standalone.html` con doble clic. Listo.

### Opción B — Como PWA real (recomendada para demo)
```bash
cd prototipo-fosf20
python3 -m http.server 8080
# Abrir http://localhost:8080 en Chrome/Edge
# Chrome mostrará "Instalar app" en la barra de direcciones
```

Instalada como PWA, aparece como app independiente en el sistema operativo
y funciona sin conexión (Service Worker cachea todo).

## Lo que valida este prototipo

1. ✅ **Búsqueda única** — exactamente lo que pidió el usuario en el audio:
   "que yo coloque solo el medicamento en un buscador"
2. ✅ **Tolerancia a acentos y variaciones** — busca "amiodarona" o
   "AMIODARÓNA" o "amiodarona clorhidrato" y encuentra lo mismo
3. ✅ **Ficha unificada** — toda la información del medicamento en una
   sola pantalla, sin importar de qué hoja del Excel venga
4. ✅ **Alertas clínicas visibles** — alto riesgo se muestra como banner
   prominente arriba de la ficha
5. ✅ **Responsive mobile-first** — probá abriéndolo en el celular
6. ✅ **Offline real** — instalá como PWA y apagá el wifi

## Casos de prueba sugeridos

- `amiodarona` — 2 presentaciones, alto riesgo, múltiples diluciones
- `vancomicina` — 9 presentaciones de distintos laboratorios
- `morfina` — alto riesgo + horario VO + estabilidad
- `acetaminofen` — caso común, múltiples fuentes
- `cefazolina` — antibiótico con múltiples soluciones compatibles
- `insulina` — varias presentaciones tipo pen/flexpen

## Datos

- **847 medicamentos** consolidados de las 7 hojas del Excel FO-SF-20 v8.1
- **347** con datos completos de estabilidad
- **292** con recomendaciones de administración oral
- **268** con información de multidosis
- **57** clasificados como alto riesgo

## Qué falta para producción

Este prototipo es para validar UX. Para el MVP real falta:
- Backend con API y PostgreSQL
- ETL automatizado que corra al subir un Excel nuevo
- Autenticación por roles clínicos
- Sincronización por versión
- Auditoría de consultas
- Normalización completa de vocabularios (embarazo, lactancia, vías)
- Feedback clínico integrado (marcar errores, sugerencias)
