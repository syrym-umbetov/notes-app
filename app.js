// index.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
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

// Маршруты

// Получить все заметки
app.get('/api/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ updatedAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка сервера', error: err.message });
    }
});

// Получить заметку по ID
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

// Создать новую заметку
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

// Обновить заметку
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

// Удалить заметку
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

// Поиск заметок по тегам
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
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});