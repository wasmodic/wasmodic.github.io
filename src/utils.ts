import localforage from "localforage";
import { LOGGING, LOGGING_DEBUG } from "$src/config";

export const STATE_FS = "fs";
export const STATE_PLAYGROUND = "sandbox";
export const STATE_STUDIO = "studio";
export const STATE_QUIZ = "quiz";
export const STATE_IDE = "ide";

export class LocalState {
	static async getKey(state: string, description: string = ""): Promise<string> {
		let prefix = "guest";
		return `${prefix}:${state}:${description}`;
	}

	// -------------------------------------------------------------------------
	// General state (sandbox, studio)
	// -------------------------------------------------------------------------
	static async get<T = any>(state: string): Promise<T | null> {
		const key = await this.getKey(state);
		return await localforage.getItem<T>(key);
	}

	static async set<T = any>(state: string, value: T): Promise<T> {
		const key = await this.getKey(state);
		return await localforage.setItem<T>(key, value);
	}

	// -------------------------------------------------------------------------
	// IDE
	// -------------------------------------------------------------------------
	static async getIDE<T = any>(fn: string): Promise<T | null> {
		const key = await this.getKey(STATE_IDE, fn);
		return await localforage.getItem<T>(key);
	}

	static async setIDE<T = any>(fn: string, value: T): Promise<T> {
		const key = await this.getKey(STATE_IDE, fn);
		return await localforage.setItem<T>(key, value);
	}

	// -------------------------------------------------------------------------
	// File system
	// -------------------------------------------------------------------------
	static async getFS(tutorial: string): Promise<any[]> {
		if (!tutorial) return [];

		const key = await this.getKey(STATE_FS, tutorial);
		return (await localforage.getItem<any[]>(key)) || [];
	}

	static async setFS(tutorial: string, value: any[]): Promise<any[]> {
		if (!tutorial) throw "Stopped saving FS state because moved away from terminal.";
		log(LOGGING_DEBUG, "Saving FS state...");

		const key = await this.getKey(STATE_FS, tutorial);
		return await localforage.setItem<any[]>(key, value);
	}
}

export function log(level: number, ...message: any[]): void {
	if (LOGGING >= level) {
		console.log(...message);
	}
}

export function strToChars(str: string): number[] {
	const chars = str.split("");
	return chars.map((d) => d.charCodeAt(0));
}
