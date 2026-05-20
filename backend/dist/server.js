"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const app_js_1 = __importDefault(require("./app.js")); // Note: NodeNext resolution expects extension or TS resolves with JS
dns_1.default.setDefaultResultOrder('ipv4first');
try {
    dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
}
catch (e) {
    console.warn('Failed to set custom DNS servers, using system default:', e);
}
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-leads-db';
mongoose_1.default
    .connect(MONGODB_URI)
    .then(() => {
    console.log('Connected to MongoDB successfully.');
    app_js_1.default.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('Database connection failed:', err);
    process.exit(1);
});
