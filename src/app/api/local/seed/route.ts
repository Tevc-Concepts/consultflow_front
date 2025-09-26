import { NextRequest } from 'next/server';
import { forceSeed } from '@shared/api/localDb';

export async function POST(req: NextRequest) {
    try {
        forceSeed();
        return Response.json({ 
            success: true, 
            message: 'Database refreshed with fresh dummy data for all companies' 
        });
    } catch (error: any) {
        console.error('Failed to refresh database:', error);
        return Response.json({ 
            success: false, 
            error: error.message || 'Failed to refresh database' 
        }, { status: 500 });
    }
}