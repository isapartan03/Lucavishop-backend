# Lucavishop-backend - Tienda de ropa

API del ecommerce desarrollada con Node.js, Express y MySQL. Este backend proporciona toda la lógica de negocio y expone una API REST que incluye autenticación de usuarios, gestión de productos, carrito de compras, sistema de órdenes, foro de preguntas, favoritos, calificaciones y notificaciones en tiempo real.

⚠️ Este repositorio contiene únicamente el código del backend.

Proyecto inspirado en el vídeo de [RocoDev](https://youtu.be/DMW3j99HB3s?si=LytLBhDK5WUEuacn). Muchas gracias al creador por el aporte.

## Requisitos previos

- Node.js (v18 o superior)
- MySQL (XAMPP, WAMP o MySQL Workbench)
- Git

## Instalación

1. Clonar el repositorio
- git clone https://github.com/TU_USUARIO/ecomerce-backend.git
- cd ecomerce-backend

2. Instalar dependencias
- npm install

3. Configurar variables de entorno
- cp .env.example .env

Editar el archivo .env con tus credenciales:
- DB_HOST=localhost
- DB_NAME=ecommerce_db
- DB_USER=root
- DB_PASSWORD=
- JWT_SECRET=tu_clave_secreta_aqui
- EMAIL_USER=tu_correo@gmail.com
- EMAIL_PASS=tu_contraseña_de_aplicacion
- FRONTEND_URL=http://localhost:3000
- PORT=3001

5. Crear la base de datos en MySQL
- CREATE DATABASE ecommerce_db;

6. Ejecutar el servidor en modo desarrollo
- npm run dev

El servidor correrá en http://localhost:3001

Scripts disponibles
- npm run dev	Modo desarrollo con reinicio automático (nodemon)
- npm start	Modo producción

Tecnologías utilizadas
- Node.js	Entorno de ejecución
- Express	Framework web
- MySQL	Base de datos relacional
- Sequelize	ORM para MySQL
- JWT	Autenticación por tokens
- bcryptjs	Encriptación de contraseñas
- Nodemailer	Envío de correos (recuperación de contraseña)
- Multer	Subida de archivos (imágenes de productos y avatares)
- Zod	Validación de datos
- Cors	Manejo de peticiones cruzadas
- Cookie-parser	Lectura de cookies

Notas importantes
- El primer usuario registrado se convierte automáticamente en administrador
- Las contraseñas se encriptan con bcrypt antes de guardarse
- La autenticación utiliza JWT almacenado en cookies HttpOnly
- Para enviar correos con Gmail, se necesita una contraseña de aplicación (no la contraseña normal)

## 🔗 Front
- Este frontend consume la API del repositorio backend:https://github.com/isapartan03/Lucavishop-frontend

## 👥 Autores
- Jeremy I. Ramírez A.
- Johny L. Torres (https://github.com/JohnyTorresDev)
