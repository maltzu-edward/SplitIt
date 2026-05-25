import { Injectable, BadRequestException } from '@nestjs/common';

export interface ReceiptItem {
  name: string;
  price: number;
}

export interface ReceiptResult {
  title: string;
  items: ReceiptItem[];
  total: number;
}

@Injectable()
export class OcrService {
  async scanReceipt(imageBase64: string, mimeType: string): Promise<ReceiptResult> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new BadRequestException('OCR service not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: 'Ini adalah foto struk/nota belanja. Ekstrak informasi dan kembalikan HANYA dalam format JSON berikut (tanpa teks lain): {"title": "nama toko atau deskripsi singkat", "items": [{"name": "nama item", "price": 24000}], "total": 50000}. PENTING: (1) Untuk field "price" setiap item, gunakan TOTAL harga per baris (jumlah x harga satuan). Misalnya jika struk menampilkan "2 x 12.000 = 24.000", gunakan 24000 sebagai price (bukan 12000). (2) Jika ada pajak/tax/PPN/service charge, tambahkan sebagai item terpisah di akhir array items, contoh: {"name": "Pajak", "price": 18975}. (3) Field "total" harus sama dengan total akhir di struk (sudah termasuk pajak). Semua harga dalam angka (bukan string). Jika tidak bisa membaca struk, kembalikan {"title": "Struk", "items": [], "total": 0}.',
              },
            ],
          },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('[OCR] Groq API error:', JSON.stringify(errBody));
      throw new BadRequestException('Failed to process image with OCR service');
    }

    const data = await response.json() as any;
    const content: string = data.choices?.[0]?.message?.content ?? '';

    try {
      // Strip markdown code blocks if present
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed: ReceiptResult = JSON.parse(cleaned);
      return {
        title: parsed.title || 'Struk',
        items: Array.isArray(parsed.items) ? parsed.items : [],
        total: Number(parsed.total) || 0,
      };
    } catch {
      throw new BadRequestException('Could not parse receipt data from image');
    }
  }
}
