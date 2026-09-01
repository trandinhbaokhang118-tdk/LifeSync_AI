import { Injectable, Logger, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface GeneratedImage {
    /** Base64-encoded image data (without the data: prefix). */
    base64: string;
    mimeType: string;
    /** Convenience data URL the frontend can drop straight into an <img src>. */
    dataUrl: string;
}

/**
 * Image generation via Google Gemini.
 * Uses the Generative Language REST API so no extra SDK dependency is needed.
 */
@Injectable()
export class ImageGenerationService {
    private readonly logger = new Logger(ImageGenerationService.name);
    private readonly apiKey: string;
    private readonly model: string;

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || '';
        this.model =
            this.configService.get<string>('GEMINI_IMAGE_MODEL') ||
            'gemini-2.5-flash-image';
    }

    isEnabled(): boolean {
        return !!this.apiKey;
    }

    async generateImage(prompt: string): Promise<GeneratedImage> {
        if (!prompt?.trim()) {
            throw new BadRequestException('Vui lòng nhập mô tả cho ảnh.');
        }
        if (!this.isEnabled()) {
            throw new ServiceUnavailableException(
                'Tính năng tạo ảnh chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.',
            );
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

        try {
            const response = await axios.post(
                url,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        // Ask the model to return an image (and optionally text).
                        responseModalities: ['IMAGE', 'TEXT'],
                    },
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 60_000,
                },
            );

            const parts = response.data?.candidates?.[0]?.content?.parts ?? [];
            const imagePart = parts.find(
                (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data,
            );

            if (!imagePart?.inlineData?.data) {
                this.logger.warn('Gemini returned no image data for prompt.');
                throw new ServiceUnavailableException('Không thể tạo ảnh lúc này. Vui lòng thử lại.');
            }

            const base64 = imagePart.inlineData.data as string;
            const mimeType = (imagePart.inlineData.mimeType as string) || 'image/png';

            return {
                base64,
                mimeType,
                dataUrl: `data:${mimeType};base64,${base64}`,
            };
        } catch (error) {
            if (error instanceof ServiceUnavailableException || error instanceof BadRequestException) {
                throw error;
            }
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            this.logger.error(`Gemini image generation failed: ${axiosError.message}`);
            if (axiosError.response) {
                this.logger.error(
                    `Gemini response ${status}: ${JSON.stringify(axiosError.response.data)}`,
                );
            }

            // 429 = quota/rate limit. Image models often need billing enabled.
            if (status === 429) {
                throw new ServiceUnavailableException(
                    'Tính năng tạo ảnh đã hết hạn mức (quota) của Google hoặc chưa bật thanh toán cho model tạo ảnh. Vui lòng thử lại sau hoặc kiểm tra cấu hình Gemini.',
                );
            }
            if (status === 400 || status === 403) {
                throw new ServiceUnavailableException(
                    'Khóa Gemini không hợp lệ hoặc không có quyền dùng model tạo ảnh. Vui lòng kiểm tra GEMINI_API_KEY và GEMINI_IMAGE_MODEL.',
                );
            }
            throw new ServiceUnavailableException('Không thể tạo ảnh lúc này. Vui lòng thử lại sau.');
        }
    }
}
