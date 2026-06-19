import fs from 'fs/promises';
import path from 'path';

const STATE_FILE = path.join(process.cwd(), 'data', 'state.json');

export async function readState() {
  try {
    const data = await fs.readFile(STATE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error('Lỗi khi đọc file state.json:', error.message);
    return {};
  }
}

export async function writeState(state) {
  try {
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Lỗi khi lưu file state.json:', error.message);
  }
}

export async function writeVouchers(vouchers) {
  try {
    const VOUCHERS_FILE = path.join(process.cwd(), 'data', 'vouchers.json');
    await fs.writeFile(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2), 'utf-8');
  } catch (error) {
    console.error('Lỗi khi lưu file vouchers.json:', error.message);
  }
}