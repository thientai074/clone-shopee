export class ApiResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data?: any;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };

    constructor(statusCode: number, message: string, data?: any, meta?: any) {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
    }

    static success(message: string, data?: any, meta?: any) {
        return new ApiResponse(200, message, data, meta);
    }

    static created(message: string, data?: any) {
        return new ApiResponse(201, message, data);
    }

    static noContent(message = 'Success') {
        return new ApiResponse(204, message);
    }
}
