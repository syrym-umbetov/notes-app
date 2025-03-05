const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notes API',
            version: '1.0.0',
            description: 'API для управления заметками',
            contact: {
                name: 'API Support',
                email: 'umbetovsyrym@gmail.com',
            },
        },
        servers: [
            {
                url: 'https://notes-app-pf7q.onrender.com',
                description: 'Production server',
            },
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
        ],
        components: {
            schemas: {
                Note: {
                    type: 'object',
                    required: ['title', 'content'],
                    properties: {
                        _id: {
                            type: 'string',
                            description: 'Автоматически генерируемый MongoDB ID',
                        },
                        title: {
                            type: 'string',
                            description: 'Заголовок заметки',
                        },
                        content: {
                            type: 'string',
                            description: 'Содержание заметки',
                        },
                        tags: {
                            type: 'array',
                            items: {
                                type: 'string',
                            },
                            description: 'Теги заметки',
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата создания',
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Дата последнего обновления',
                        },
                    },
                    example: {
                        title: 'Заметка о Swagger',
                        content: 'Swagger - отличный инструмент для документирования API',
                        tags: ['swagger', 'api', 'документация'],
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                        },
                        error: {
                            type: 'string',
                        },
                    },
                },
            },
        },
    },
    apis: ['./routes/*.js', './app.js'], // файлы, содержащие аннотации
};

const specs = swaggerJsdoc(options);

module.exports = specs;