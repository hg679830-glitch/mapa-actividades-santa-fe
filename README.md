# Mapa de Actividades y Autonomía Operativa · Unión de Crédito Santa Fe

Cuestionario de una sola página (HTML/CSS/JS puro, sin servidor propio) para
que cada empleado registre qué actividades hace, con qué frecuencia, si las
puede completar solo de inicio a fin y qué necesitaría para hacerlas mejor.
Las respuestas se guardan directamente en un Google Sheet.

No requiere backend propio: se puede publicar gratis con **GitHub Pages** y
las respuestas se recolectan mediante un **Google Apps Script** conectado a
un Google Sheet.

## Estructura del proyecto

```
index.html      Página principal (estructura)
style.css       Estilos (tema oscuro / dorado)
data.js         Preguntas y actividades de cada área (generadas del Excel original)
app.js          Lógica: navegación, guardado local, envío a Google Sheets
config.js       Aquí se pega la URL de tu Google Apps Script
apps-script.gs  Código para pegar en Google Apps Script (ver abajo)
```

## Conectar con Google Sheets

1. Crea un Google Sheet nuevo (o usa uno existente) — por ejemplo
   "Mapa de Actividades — Respuestas".
2. Ve a **Extensiones → Apps Script**.
3. Borra el contenido de `Código.gs` y pega ahí todo el contenido del
   archivo [`apps-script.gs`](apps-script.gs) de este repositorio.
4. Guarda el proyecto (ícono de disquete).
5. Haz clic en **Implementar → Nueva implementación**.
   - Tipo: **Aplicación web**.
   - Ejecutar como: **Yo (tu cuenta)**.
   - Quién tiene acceso: **Cualquier usuario**.
6. Clic en **Implementar**. Google te dará una URL que termina en `/exec`
   — cópiala.
7. Abre el archivo [`config.js`](config.js) de este proyecto y pega esa URL:
   ```js
   const SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
8. Guarda y sube el cambio a GitHub.

Cada vez que alguien envíe el cuestionario, se crea (o se reemplaza, si esa
persona ya había enviado antes) una **hoja con el nombre de esa persona**
dentro de tu Google Sheet. Ahí quedan todas sus actividades marcadas Sí/No,
incluyendo las que agregó en "OTRAS ACTIVIDADES" (aparecen como
`[OTRA] <lo que escribió>`), y sus tres respuestas de Cierre (sección `CIERRE`).

> Si dos personas distintas tienen el mismo nombre, van a compartir la misma
> hoja (se sobrescriben entre sí). Si eso llega a pasar, dile a una de ellas
> que use su nombre completo con algo que las distinga (por ejemplo agregando
> su área) al llenar el campo "Nombre completo".

> Si alguna vez necesitas cambiar la lógica de guardado, vuelve a editar
> `apps-script.gs` en este repo y **cópialo de nuevo** al editor de Apps
> Script (no se sincronizan solos) — luego usa **Implementar → Administrar
> implementaciones → Editar → Nueva versión** para que el cambio surta efecto
> en la URL ya publicada.

## Subir el proyecto a GitHub

Este repositorio ya tiene un primer commit local. Para subirlo:

1. En GitHub, crea un repositorio nuevo y **vacío** (sin README, sin
   `.gitignore` — este proyecto ya trae los suyos). Por ejemplo, llámalo
   `mapa-actividades-santa-fe` y márcalo **público** (necesario para usar
   GitHub Pages gratis).
2. GitHub te mostrará una URL como
   `https://github.com/<tu-usuario>/mapa-actividades-santa-fe.git` — cópiala.
3. En una terminal, parado en esta carpeta, corre:
   ```bash
   git remote add origin https://github.com/<tu-usuario>/mapa-actividades-santa-fe.git
   git branch -M main
   git push -u origin main
   ```
4. Recarga la página del repositorio en GitHub — ya deberías ver todos los
   archivos (`index.html`, `app.js`, `data.js`, etc.).

> Si `config.js` ya tiene la URL real de tu Google Apps Script pegada
> (ver sección siguiente) antes de este paso, ese valor también queda
> subido. Si prefieres configurarlo después, puedes editarlo directo en
> GitHub (ícono de lápiz sobre el archivo) y hacer commit del cambio.

## Publicar la página (GitHub Pages)

1. Con el repositorio ya subido a GitHub (paso anterior).
2. En el repo: **Settings → Pages**.
3. En "Build and deployment", selecciona **Deploy from a branch**, rama
   `main`, carpeta `/ (root)`.
4. Guarda. En un par de minutos tu cuestionario queda disponible en
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`.
5. Comparte esa liga con las personas que deben llenarlo.

## Uso

- Cada persona llena solo las hojas de las áreas en las que participa
  (aunque no sea formalmente su puesto).
- Puede dejarlo a medias: el avance se guarda en el navegador de esa persona
  (localStorage) y sigue ahí si vuelve a entrar a la misma liga desde el
  mismo navegador y la misma computadora.
- Al llegar a "Cierre" y dar clic en **Enviar respuestas**, los datos se
  mandan al Google Sheet y ya no se pueden editar desde ahí (para corregir
  algo, contactar a quien administra el cuestionario).

## Desarrollo local

No hace falta ningún servidor ni instalación: basta con abrir `index.html`
directamente en el navegador, o servirlo con cualquier servidor estático,
por ejemplo:

```bash
python -m http.server 8000
```

y luego entrar a `http://localhost:8000`.
