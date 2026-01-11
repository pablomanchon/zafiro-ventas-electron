# 💎 Zafiro – Stock y Ventas

**Zafiro** es una aplicación de escritorio para la **gestión integral de stock, ventas y caja**, pensada para comercios, gastronomía y pequeños negocios.  
Permite administrar productos, clientes, ventas, movimientos de caja y múltiples métodos de pago de forma simple, rápida y offline-first.

---

## 🚀 Características principales

- 📦 Gestión de **productos y stock**
- 🧾 Registro de **ventas** con detalle por ítem
- 💰 **Caja** con ingresos y egresos
- 💳 Soporte para **múltiples métodos de pago**  
  (Efectivo, Débito, Crédito, Mercado Pago, Dólar, Pendiente, personalizados)
- 📊 Paneles de resumen y totales
- 🗑️ Eliminación lógica (historial completo)
- 🖥️ Aplicación **desktop multiplataforma**
- 📶 Funciona **sin conexión a internet**

---

## 🛠️ Tecnologías utilizadas

### Frontend
- ⚛️ **React**
- ⚡ **Vite**
- 🎨 **Tailwind CSS**
- 🧠 **Zustand** (estado global)

### Backend
- 🟢 **Node.js**
- 🧩 **Express / NestJS**
- 🗄️ **SQLite**
- 🧬 **TypeORM**

### Desktop
- 🖥️ **Electron**

---

## 🧱 Arquitectura

El proyecto sigue una arquitectura clara y escalable:

Controlador -> Servicio -> Repositorio


- Separación de responsabilidades
- DTOs para validación de datos
- Enums para estados y métodos de pago
- Eliminación lógica (`isDeleted`) en todas las entidades

---

## 📂 Módulos principales

- Productos
- Clientes
- Ventas
- Detalle de ventas
- Caja
- Movimientos de stock
- Métodos de pago
- Gastronomía (platos, precios, stock)
- Vendedores

---

## 📥 Descarga

👉 **Instalador (Windows):**  
🔗 https://github.com/pablomanchon/Zafiro-Stock-y-Ventas/releases/latest

> El instalador se distribuye mediante **GitHub Releases**.

---

## 🧑‍💻 Desarrollo local

### Requisitos
- Node.js ≥ 18
- npm

### Instalación
```bash
npm install

