const express = require("express");
const app = express();
const mysql = require("mysql2/promise"); // Importa la API de Promises de mysql2
const cors = require("cors");
const bcrypt = require('bcrypt');

app.use(cors());
app.use(express.json());

const db = mysql.createPool({ // Usa createPool en lugar de createConnection para Promises
    host: "host.docker.internal",
    user: "root",
    password: "",
    database: "nova_salud"
});

// Rutas para la gestión de productos
app.post("/api/productos/create", async (req, res) => {
    const nombre = req.body.nombre;
    const stock = req.body.stock;
    const precio = req.body.precio;
    const descripcion = req.body.descripcion;

    try {
        await db.query('INSERT INTO productos (nombre, stock, precio, descripcion) VALUES (?, ?, ?, ?)', [nombre, stock, precio, descripcion]);
        res.send("Producto registrado con éxito");
    } catch (err) {
        console.error("Error al crear producto:", err);
        res.status(500).send("Error al registrar el producto");
    }
});

app.get("/api/productos", async (req, res) => {
    const searchTerm = req.query.searchTerm;
    let query = 'SELECT * FROM productos';
    const queryParams = [];

    if (searchTerm) {
        query += ' WHERE nombre LIKE ? OR descripcion LIKE ?';
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    try {
        const [result] = await db.query(query, queryParams);
        res.send(result);
    } catch (err) {
        console.error("Error al obtener productos:", err);
        res.status(500).send("Error al obtener la lista de productos");
    }
});

app.put("/api/productos/update", async (req, res) => {
    const id = req.body.id;
    const nombre = req.body.nombre;
    const stock = req.body.stock;
    const precio = req.body.precio;
    const descripcion = req.body.descripcion;

    try {
        await db.query("UPDATE productos SET nombre=?, stock=?, precio=?, descripcion=? WHERE id=?",
            [nombre, stock, precio, descripcion, id]);
        res.send("Producto actualizado con éxito");
    } catch (err) {
        console.error("Error al actualizar producto:", err);
        res.status(500).send("Error al actualizar el producto");
    }
});

app.delete("/api/productos/delete/:id", async (req, res) => {
    const id = req.params.id;

    try {
        await db.query("DELETE FROM productos WHERE id=?", id);
        res.send("Producto eliminado con éxito");
    } catch (err) {
        console.error("Error al eliminar producto:", err);
        res.status(500).send("Error al eliminar el producto");
    }
});

// Rutas para la autenticación de usuarios
app.post("/api/auth/register", async (req, res) => {
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (rows.length > 0) {
            return res.status(409).send("El usuario ya existe");
        }

        const hashedPassword = await bcrypt.hash(contrasena, 10);
        await db.query('INSERT INTO usuarios (usuario, contrasena) VALUES (?, ?)', [usuario, hashedPassword]);
        res.status(201).send("Usuario registrado con éxito");

    } catch (error) {
        console.error("Error al registrar usuario:", error);
        res.status(500).send("Error al registrar el usuario");
    }
});

app.post("/api/auth/login", async (req, res) => {
    const usuario = req.body.usuario;
    const contrasena = req.body.contrasena;

    try {
        const [rows] = await db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
        if (rows.length === 0) {
            return res.status(401).send("Credenciales incorrectas");
        }

        const isPasswordMatch = await bcrypt.compare(contrasena, rows[0].contrasena);
        if (isPasswordMatch) {
            // Aquí podrías generar un token JWT para una autenticación más segura
            res.send({ message: "Inicio de sesión exitoso", userId: rows[0].id, username: rows[0].usuario });
        } else {
            res.status(401).send("Credenciales incorrectas");
        }

    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        res.status(500).send("Error al iniciar sesión");
    }
});

app.listen(3001, () => {
    console.log("Servidor corriendo en el puerto 3001");
});