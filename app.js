const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());

// CORS middleware для доступа к API из других доменов
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Редирект с корневого пути на Swagger UI
app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

// Подключение к MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notes-app';
console.log('Попытка подключения к MongoDB по адресу:', mongoURI);

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 // Таймаут в 5 секунд
})
    .then(() => console.log('MongoDB подключена успешно!'))
    .catch(err => {
        console.error('Ошибка подключения к MongoDB:');
        console.error('Сообщение:', err.message);
        console.error('Детали ошибки:', err);
        console.log('Пожалуйста, убедитесь, что MongoDB запущен и доступен.');
    });

// Схема заметки
const noteSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Модель заметки
const Note = mongoose.model('Note', noteSchema);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Получить все заметки
 *     description: Возвращает список всех заметок, отсортированный по дате обновления
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Успешный ответ со списком заметок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Получить заметку по ID
 *     description: Возвращает заметку по указанному ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID заметки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Успешный ответ с заметкой
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Заметка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/notes/:id', async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({ message: 'Заметка не найдена' });
        }

        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Создать новую заметку
 *     description: Создает новую заметку с указанными данными
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Заголовок заметки
 *               content:
 *                 type: string
 *                 description: Содержание заметки
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Теги заметки
 *     responses:
 *       201:
 *         description: Заметка успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         description: Неверный запрос - отсутствуют обязательные поля
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/notes', async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Заголовок и содержание обязательны' });
        }

        const newNote = new Note({
            title,
            content,
            tags: tags || []
        });

        const savedNote = await newNote.save();
        res.status(201).json(savedNote);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Обновить заметку
 *     description: Обновляет заметку по указанному ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID заметки
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Заголовок заметки
 *               content:
 *                 type: string
 *                 description: Содержание заметки
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Теги заметки
 *     responses:
 *       200:
 *         description: Заметка успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Заметка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.put('/api/notes/:id', async (req, res) => {
    try {
        const { title, content, tags } = req.body;

        // Обновляем время изменения
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            {
                title,
                content,
                tags,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!updatedNote) {
            return res.status(404).json({ message: 'Заметка не найдена' });
        }

        res.json(updatedNote);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Удалить заметку
 *     description: Удаляет заметку по указанному ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID заметки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Заметка успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 note:
 *                   $ref: '#/components/schemas/Note'
 *       404:
 *         description: Заметка не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.delete('/api/notes/:id', async (req, res) => {
    try {
        const deletedNote = await Note.findByIdAndDelete(req.params.id);

        if (!deletedNote) {
            return res.status(404).json({ message: 'Заметка не найдена' });
        }

        res.json({ message: 'Заметка успешно удалена', note: deletedNote });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

/**
 * @swagger
 * /api/notes/tags/{tag}:
 *   get:
 *     summary: Поиск заметок по тегу
 *     description: Возвращает список заметок, содержащих указанный тег
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: tag
 *         required: true
 *         description: Тег для поиска
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Успешный ответ со списком заметок
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       500:
 *         description: Ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/notes/tags/:tag', async (req, res) => {
    try {
        const tag = req.params.tag;
        const notes = await Note.find({ tags: tag }).sort({ updatedAt: -1 });

        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Запуск сервера
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
        console.log(`Документация API доступна по адресу: http://localhost:${PORT}/api-docs`);
    });
}

module.exports = app;