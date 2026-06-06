# FichaRx — Manual de Medicamentos FO-SF-20

Prototipo navegable para validar la UX del buscador y la ficha unificada antes
de invertir en backend y stack completo.

## Contenido

| Archivo / Carpeta | Propósito |
| --- | --- |
| `prototipo_standalone.html` | Versión todo-en-uno. Sin servidor ni internet. |
| `index.html` | Entrada PWA — carga el dataset en tiempo de ejecución |
| `dataset_final.json` | 847 medicamentos consolidados de las 7 hojas del Excel FO-SF-20 v8.1 |
| `sw.js` | Service Worker — cachea todos los assets para uso offline |
| `manifest.webmanifest` | Manifiesto PWA (nombre, íconos, color de tema) |
| `css/styles.css` | Estilos globales |
| `js/` | Módulos ES organizados por capas (ver Arquitectura) |
| `img/` | Assets gráficos (logo FichaRx) |

## Cómo probar

### Opción A — Rápida (sin instalar nada)
Abre `prototipo_standalone.html` con doble clic. Listo.

### Opción B — Como PWA real (recomendada para demo)
```bash
python -m http.server 8080
# Abrir http://localhost:8080 en Chrome/Edge
# Chrome mostrará "Instalar app" en la barra de direcciones
```

Instalada como PWA, aparece como app independiente y funciona sin conexión
(el Service Worker cachea todo en el primer acceso).

## Arquitectura JS

El código está separado en capas bajo `js/`:

```
js/
├── domain/
│   └── Medicamento.js              # Entidad del dominio
├── application/
│   ├── BusquedaService.js          # Lógica de búsqueda fuzzy (tolerante a acentos)
│   └── commands/
│       ├── BuscarCommand.js
│       ├── AbrirFichaCommand.js
│       └── CerrarFichaCommand.js
├── infrastructure/
│   ├── JsonMedicamentosRepository.js   # Carga dataset_final.json
│   └── LocalStorageHistorialRepo.js    # Historial de consultas
├── presentation/
│   ├── AppController.js            # Orquestador principal
│   ├── FichaBuilder.js             # Construye la ficha completa
│   ├── FichaView.js                # Render y animaciones de la ficha
│   ├── ResultadosRenderer.js       # Lista de resultados de búsqueda
│   ├── SectionFactory.js           # Fábrica de secciones de la ficha
│   └── sections/
│       ├── AltoRiesgoSection.js
│       ├── MultidosisSection.js
│       ├── HorarioVoSection.js
│       ├── PresentacionesSection.js
│       ├── FuentesSection.js
│       └── SectionRenderer.js
└── app.js                          # Bootstrap
```

## Lo que valida este prototipo

1. **Búsqueda única** — exactamente lo que pidió el usuario: "que yo coloque solo el medicamento en un buscador"
2. **Tolerancia a acentos y variaciones** — `amiodarona`, `AMIODARÓNA` y `amiodarona clorhidrato` encuentran lo mismo
3. **Ficha unificada** — toda la información en una sola pantalla, sin importar de qué hoja del Excel provenga
4. **Alertas clínicas visibles** — alto riesgo se muestra como banner prominente al tope de la ficha
5. **Secciones interactivas** — presentaciones y secciones colapsables; presentaciones expandibles con detalle completo
6. **Historial de consultas** — guarda los últimos medicamentos consultados en `localStorage`
7. **Patrón Command** — acciones de búsqueda, apertura y cierre de ficha encapsuladas como comandos
8. **Responsive mobile-first** — probalo abriendo en el celular
9. **Offline real** — instalá como PWA y apagá el wifi

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