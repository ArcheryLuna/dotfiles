"use strict";
// import { DebugLogger } from './logManager';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadManager = void 0;
class ThreadManager {
    get CUR_THREAD_ID() {
        return this._CUR_THREAD_ID;
    }
    constructor() {
        this._CUR_THREAD_ID = ThreadManager.NEXT_THREAD_ID;
        ThreadManager.NEXT_THREAD_ID++;
        ThreadManager.THREAD_ID_COUNTER++;
    }
    // 析构函数 如果线程数为0, 待分配线程号也置0
    destructor() {
        ThreadManager.THREAD_ID_COUNTER--;
        if (ThreadManager.THREAD_ID_COUNTER === 0) {
            ThreadManager.NEXT_THREAD_ID = 0;
        }
    }
}
exports.ThreadManager = ThreadManager;
ThreadManager.THREAD_ID_COUNTER = 0; // 线程计数器
ThreadManager.NEXT_THREAD_ID = 0; // 指示下一个待分配 thread id
//# sourceMappingURL=threadManager.js.map