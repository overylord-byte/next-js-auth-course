import { createApp } from '@/app';

const PORT = Number(process.env.PORT) || 3001;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const app = createApp();

app.listen(PORT, () => {
    console.log('----------------------------------------');
    console.log('Mock API server is running');
    console.log(`Environment : ${NODE_ENV}`);
    console.log(`Port        : ${PORT}`);
    console.log(`Base URL    : http://localhost:${PORT}`);
    console.log(`API v1     : http://localhost:${PORT}/api/v1`);
    console.log('----------------------------------------');
});