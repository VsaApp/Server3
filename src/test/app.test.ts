import request from 'supertest';
import app from '../app';

describe('Misc', () => {
    test('API is up', () => {
        return request(app).get('/').then((response: any) => {
            expect(response.statusCode).toBe(200);
        });
    });
    test('CORS is enabled', () => {
        return request(app).get('/').then((response: any) => {
            expect(response.headers['access-control-allow-origin']).toBe('*');
        });
    });
});