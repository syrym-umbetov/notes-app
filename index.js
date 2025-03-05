const app = require('./app');

const PORT = process.env.PORT || 3001;

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Документация API доступна по адресу: http://localhost:${PORT}/api-docs`);
});