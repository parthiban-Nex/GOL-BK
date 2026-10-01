import express from 'express';
const app = express();

import userRoutes from './user/routes';

app.use('/users', userRoutes);
