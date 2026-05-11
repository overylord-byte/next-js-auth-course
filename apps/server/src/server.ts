import { createApp } from '@/app';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const cwd = process.cwd();
const envLocalPath = resolve(cwd, '.env.local');
const envPath = resolve(cwd, '.env');

if (existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
} else if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

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