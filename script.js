/**
 * Cephalopod Evolution Simulator - v3.0 Epoch Evolution
 * 
 * 架构说明：
 * 1. CONFIG: 全局配置与常量
 * 2. EPOCH_DATA: 纪元数据（世界书）
 * 3. STATE: 运行时数据状态
 * 4. STORAGE: IndexedDB 存档管理
 * 5. UI: 界面渲染与DOM操作
 * 6. PROMPTS: AI 提示词模板（动态生成）
 * 7. AI: 与 LLM 的通信层
 * 8. LOGIC: 游戏数值计算核心（包含大事件处理）
 * 9. CONTROLLER: 游戏流程主控
 */

// ================= 1. CONFIG (配置区) =================
const Config = {
    API_KEY: 'sk-tfffxwslxkgzwhvnwyrxodmfzjwhklmbwefovkdpvektnioi', // 填入你的 Key
    API_URL: 'https://api.siliconflow.cn/v1/chat/completions',     // 填入你的反代地址
    MODEL_NAME: 'deepseek-ai/DeepSeek-V3.2',
    DB_NAME: 'CephalopodEvolutionDB',
    STORE_NAME: 'gameStateStore',
    DB_VERSION: 1
};

// ================= 2. EPOCH_DATA (世界书) =================
const EPOCH_DATA = {
    "cambrian": {
        name: "寒武纪",
        advanced: "三叶虫、奇虾（顶级掠食者）",
        primitive: "海绵、古杯动物",
        event: "寒武纪生命大爆发：多细胞生物的种类和数量在短时间内爆炸性增长。世界焕然一新。"
    },
    "ordovician": {
        name: "奥陶纪",
        advanced: "鹦鹉螺类（直壳鹦鹉螺，顶级掠食者）、早期鱼类（无颌类）",
        primitive: "笔石动物、海绵",
        event: "奥陶纪末大灭绝：全球急剧变冷，冰川锁住了大量水分，海平面骤降。约85%的海洋物种未能适应这剧变而消失。"
    },
    "silurian": {
        name: "志留纪",
        advanced: "有颌鱼类（盾皮鱼、棘鱼）、海蝎子",
        primitive: "牙形石、海绵",
        event: "志留纪-泥盆纪过渡：气候回暖，冰川融化，海平面回升。生物开始尝试登陆，开拓新的生存空间。"
    },
    "devonian": {
        name: "泥盆纪",
        advanced: "盾皮鱼类（如邓氏鱼）、早期两栖类",
        primitive: "无颌类、海绵",
        event: "泥盆纪末大灭绝：又称“凯尔瓦塞事件”，海洋严重缺氧，珊瑚礁生态系统崩溃。硬壳的顶级掠食者遭受重创。"
    },
    "carboniferous": {
        name: "石炭纪",
        advanced: "巨型节肢动物（如巨脉蜻蜓）、早期爬行动物",
        primitive: "原始昆虫、鲎类、海绵",
        event: "石炭纪雨林崩溃事件：气候突然变冷变干，巨大的沼泽森林消退，大气含氧量下降，依赖高氧的巨型节肢动物面临危机。"
    },
    "permian": {
        name: "二叠纪",
        advanced: "合弓纲（似哺乳爬行动物）、双孔类爬行动物",
        primitive: "三叶虫（末期灭绝）、腕足动物",
        event: "二叠纪末大灭绝：地球史上最严重的灭绝事件。西伯利亚超级火山喷发，全球急剧升温，海洋酸化缺氧，约96%的海洋物种和70%的陆地脊椎动物消失。"
    },
    "triassic": {
        name: "三叠纪",
        advanced: "早期恐龙、早期哺乳动物、鱼龙",
        primitive: "牙形石（末期灭绝）、双壳类",
        event: "三叠纪末大灭绝：可能与火山活动和气候变化有关。这次事件清除了许多大型竞争者，为恐龙的崛起铺平了道路。"
    },
    "jurassic": {
        name: "侏罗纪",
        advanced: "大型蜥脚类恐龙、兽脚类恐龙、翼龙",
        primitive: "海绵（形成礁体）、菊石",
        event: "盘古大陆分裂：超级大陆开始分裂，形成了新的海洋和海岸线，改变了全球气候和洋流，为生物演化提供了新的舞台。"
    },
    "cretaceous": {
        name: "白垩纪",
        advanced: "暴龙、沧龙、鸟类",
        primitive: "菊石（末期灭绝）、海绵",
        event: "白垩纪-古近纪灭绝事件：一颗巨大的小行星撞击地球，引发了全球性的火灾、海啸和“核冬天”。恐龙时代宣告结束。"
    },
    "paleogene": {
        name: "古近纪",
        advanced: "哺乳动物（全面辐射，如剑齿虎、始祖象）、大型掠食性鸟",
        primitive: "有孔虫（单细胞动物）、海绵",
        event: "古新世-始新世极热事件：全球温度在短时间内急剧上升，导致海洋大规模酸化和生物灭绝，但同时也促进了哺乳动物的快速辐射演化。"
    },
    "neogene": {
        name: "新近纪",
        advanced: "高等哺乳动物（猿类、象、马、鲸）",
        primitive: "有孔虫、海绵",
        event: "全球变冷与冰期开始：地球气候进入一个新的冷却阶段，南北两极形成永久性冰盖，草原扩张，森林退缩，迫使动物适应新的开阔环境。"
    },
    "quaternary": {
        name: "第四纪",
        advanced: "人类（智人）、现代哺乳动物",
        primitive: "有孔虫、海绵、水熊虫",
        event: "智人崛起与全新世：人类的智慧和工具使用能力使其成为全球性的主导力量，深刻地改变了地球的生态系统，开启了一个新的地质时代——人类世。"
    }
};

const EPOCH_ORDER = [
    "cambrian", "ordovician", "silurian", "devonian", "carboniferous",
    "permian", "triassic", "jurassic", "cretaceous",
    "paleogene", "neogene", "quaternary"
];

// ================= 3. STATE (状态管理) =================
const INITIAL_STATE = {
    energy: 85,
    maxEnergy: 100,
    evolutionProgress: 0,
    maxEvolutionProgress: 100,
    epochProgress: 0,
    maxEpochProgress: 100,
    currentEpochIndex: 0, // 从寒武纪 (索引0) 开始
    epochName: "寒武纪",
    luck: 50,
    adaptability: 20,
    systems: {
        neuro: 10,
        structure: 15,
        motor: 12,
        metabolism: 20,
        reproduction: 5
    },
    history: []
};

let gameState = JSON.parse(JSON.stringify(INITIAL_STATE));

// ================= 4. STORAGE (存档系统) =================
const Storage = {
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(Config.DB_NAME, Config.DB_VERSION);
            request.onerror = () => reject("数据库打开失败");
            request.onsuccess = (e) => resolve(e.target.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(Config.STORE_NAME)) {
                    db.createObjectStore(Config.STORE_NAME, { keyPath: 'id' });
                }
            };
        });
    },
    async save(state) {
        try {
            const db = await this.openDB();
            const tx = db.transaction([Config.STORE_NAME], 'readwrite');
            tx.objectStore(Config.STORE_NAME).put({ id: 'current', ...state });
            console.log("💾 游戏状态已成功保存至 IndexedDB。");
        } catch (e) { console.error("存档失败:", e); }
    },
    async load() {
        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const req = db.transaction([Config.STORE_NAME], 'readonly')
                              .objectStore(Config.STORE_NAME).get('current');
                req.onsuccess = () => {
                    if (req.result) {
                        delete req.result.id;
                        resolve(req.result);
                    } else { resolve(null); }
                };
                req.onerror = () => reject("读取存档失败");
            });
        } catch (e) { console.error("读档失败:", e); return null; }
    },
    async clear() {
        try {
            const db = await this.openDB();
            db.transaction([Config.STORE_NAME], 'readwrite')
              .objectStore(Config.STORE_NAME).clear();
            console.log("🗑️ 存档已清除。");
        } catch (e) { console.error("清除存档失败:", e); }
    }
};

// ================= 5. UI (界面渲染) =================
const UI = {
    // 获取当前界面上的描述文本（用于传回给AI保持连贯性）
    getCurrentStatusDescriptions() {
        return {
            shell: document.getElementById('stat-shell').innerText,
            spawning: document.getElementById('stat-spawning').innerText,
            neuro: document.getElementById('stat-neuro').innerText,
            power: document.getElementById('stat-power').innerText,
            metabolism: document.getElementById('stat-metabolism').innerText
        };
    },

    renderStatus(data) {

        // ⭐ 关键一步：在渲染函数开头移除遮罩 ⭐
        this.hideLoading(); // 在更新内容前，立刻移除所有加载动画
        document.getElementById('story-text').innerHTML = data.story || "";
        

        document.getElementById('story-text').innerHTML = data.story || ""; // 允许HTML
        
        const status = data.status || {};
        document.getElementById('stat-shell').innerText = status.shell_desc || "未知";
        document.getElementById('stat-spawning').innerText = status.spawning_desc || "未知";
        document.getElementById('stat-neuro').innerText = status.neuro_desc || "未知";
        document.getElementById('stat-power').innerText = status.power_desc || "未知";
        document.getElementById('stat-metabolism').innerText = status.metabolism_desc || "未知";

        const env = data.environment || {};
        document.getElementById('env-location').innerText = env.location || "深海";
        document.getElementById('env-threat').innerHTML = `⚠️威胁： ${env.threat || "无"}`;
        document.getElementById('env-opportunity').innerHTML = `🍀机遇： ${env.opportunity || "无"}`;
        document.getElementById('env-prey').innerHTML = `🥘资源： ${env.prey || "无"}`;
    },

    renderOptions(options) {
        const container = document.getElementById('options-container');
        container.innerHTML = '';
        if (options && options.length > 0) {
            options.forEach(opt => {
                const btn = document.createElement('div');
                btn.className = 'option-card';
                let typeColor = '#8ecae6';
                if (opt.type === 'hunt') typeColor = '#2ecc71';
                if (opt.type === 'evolve') typeColor = '#ffb703';
                
                btn.style.borderLeft = `3px solid ${typeColor}`;
                btn.innerHTML = `
                    <span class="option-title" style="color:${typeColor}">${opt.title}</span>
                    <span class="option-desc">${opt.desc}</span>
                `;
                btn.onclick = () => Controller.handleOptionSelection(opt);
                container.appendChild(btn);
            });
        } else {
            container.innerHTML = "<div>AI 未能生成有效选项，请尝试重试...</div>";
        }
    },

    renderBars() {

        // --- ⭐ 安全检查开始 ⭐ ---
        // 防止数据为空时报错
        if (gameState.currentEpochIndex === undefined) {
            gameState.currentEpochIndex = 0; // 默认回寒武纪
        }
        // --- ⭐ 安全检查结束 ⭐ ---

        // 计算适应性
        const sysVals = Object.values(gameState.systems);
        const sysAvg = sysVals.reduce((a, b) => a + b, 0) / sysVals.length;
        gameState.adaptability = Math.round((gameState.energy * 0.6) + (sysAvg * 0.4));

        // 更新顶部栏
        this._updateBar('adaptability', gameState.adaptability, 100, gameState.adaptability);
        this._updateBar('energy', gameState.energy, gameState.maxEnergy, `${gameState.energy}/${gameState.maxEnergy}`);
        document.getElementById('current-energy-display').innerText = gameState.energy;
        
        this._updateBar('evolution', gameState.evolutionProgress, gameState.maxEvolutionProgress, `${gameState.evolutionProgress}/${gameState.maxEvolutionProgress}`);
        // 更新纪元显示
        const currentEpochKey = EPOCH_ORDER[gameState.currentEpochIndex];
        gameState.epochName = EPOCH_DATA[currentEpochKey].name;
        this._updateBar('epoch', gameState.epochProgress, gameState.maxEpochProgress, gameState.epochName);
        document.getElementById('hint-epoch').innerText = `时代洪流: ${gameState.epochProgress}%`;
        
        this._updateBar('luck', gameState.luck, 100, `${gameState.luck}/100`);

        // 更新五维图
        for (const [key, val] of Object.entries(gameState.systems)) {
            const valEl = document.getElementById(`val-system-${key}`);
            const barEl = document.getElementById(`bar-system-${key}`);
            if (valEl && barEl) {
                valEl.innerText = `${val}/100`;
                barEl.style.width = `${val}%`;
            }
        }
    },

    renderLuckFeedback(luck, title, energyD, evoD, epochD, sysTarget, sysPts) {
        const box = document.getElementById('luck-feedback');
        let color = luck > 75 ? '#2ecc71' : (luck < 25 ? '#ff5555' : '#8ecae6');
        let sysMsg = (sysTarget && sysPts > 0) 
            ? ` | 🎯 ${this._getSystemName(sysTarget)}: +${sysPts}` 
            : '';

        box.innerHTML = `
            <div style="border-left: 3px solid ${color}; padding-left: 10px;">
                <div><b>上轮抉择：</b>${title}</div>
                <div style="color:${color}"><b>🎲 幸运判定: ${luck}</b></div>
                <div>⚡ 能量: ${energyD >= 0 ? '+' : ''}${energyD} | 🧬 进化: +${evoD}%${sysMsg}</div>
                <div>🌍 纪元流逝: +${epochD}%</div>
            </div>
        `;
    },

    showMajorEvent(htmlContent) {
        // 避免重复创建
        const existingPopup = document.getElementById('major-event-popup');
        if (existingPopup) existingPopup.remove();

        const eventDiv = document.createElement('div');
        eventDiv.id = 'major-event-popup';
        eventDiv.innerHTML = `
            <div class="event-content">
                <h2>时代大事件</h2>
                <p>${htmlContent}</p>
                <button onclick="document.getElementById('major-event-popup').remove()">继续</button>
            </div>
        `;
        document.body.appendChild(eventDiv);
    },

    // 👇 新增一个专门移除遮罩的函数 👇
    hideLoading() {
        // 查找页面上所有的遮罩层并移除它们
        document.querySelectorAll('.loading-overlay').forEach(overlay => overlay.remove());
    },

    // 👇 用这个新版本替换掉旧的 showLoading 函数 👇
    showLoading() {
        // 首先，确保移除旧的遮罩，以防万一
        this.hideLoading();

        // 定义哪些区域需要显示加载动画和对应的提示文字
        const targets = {
            'story-text': '⏳ 等待命运的回响...',
            'options-container': '🌌 生命的蓝图正在绘制...',
            'status-panel': '🧬 计算生命体征...',
            'env-panel': '🌊 扫描外部环境...'
        };

        // 遍历所有目标区域
        for (const id in targets) {
            const parentElement = document.getElementById(id);
            const loadingText = targets[id];

            if (parentElement) {
                // 创建遮罩 div
                const overlay = document.createElement('div');
                overlay.className = 'loading-overlay';
                overlay.innerHTML = `<span>${loadingText}</span>`;
                
                // 将遮罩添加到父元素上
                parentElement.appendChild(overlay);
            }
        }
    },

    showError(msg) {
        document.getElementById('story-text').innerText = `⚠️ 错误: ${msg}`;
        document.getElementById('options-container').innerHTML = `<div style="color: #ff5555; text-align: center;"><button onclick="Controller.init()">点击重试</button></div>`;
    },

    _updateBar(id, val, max, text) {
        const valEl = document.getElementById(`val-${id}`);
        const barEl = document.getElementById(`bar-${id}`);
        if(valEl) valEl.innerText = text;
        if(barEl) barEl.style.width = `${(val / max) * 100}%`;
    },

    _getSystemName(key) {
        const map = { neuro: '感知', structure: '结构', motor: '动力', metabolism: '代谢', reproduction: '生殖' };
        return map[key] || key;
    }
};

// ================= 6. PROMPTS (提示词管理) =================
const Prompts = {
    System: `
    # Role
    你是一个名为“头足纲进化模拟器”的游戏引擎，负责生成富有想象力和科学依据的游戏内容。

    # Output Format
    你必须严格只输出纯 JSON 字符串，绝不能包含任何 Markdown 标记 (如 \`\`\`json) 或其他解释性文本。

    # Core Gameplay Systems
    1. **neuro**: 感知·神经。
    2. **structure**: 结构·防御。
    3. **motor**: 动力·运动。
    4. **metabolism**: 代谢·循环。
    5. **reproduction**: 生殖·繁衍。

    # JSON Structure
    {
      "story": "一段富有诗意、第二人称视角的剧情描述（约50-100字）。",
      "status": { "shell_desc": "描述...", "spawning_desc": "描述...", "neuro_desc": "描述...", "power_desc": "描述...", "metabolism_desc": "描述..." },
      "environment": { "location": "...", "threat": "...", "opportunity": "...", "prey": "..." },
      "options": [ 
        { "title": "...", "desc": "...", "type": "evolve/hunt/rest" ,"target_system": "neuro/structure/motor/metabolism/reproduction"},
        ... // 共4个
      ]
    }
    
    # Core Gameplay Rules
    - 必须生成【4个】选项。
    - 'type' 必须是 "evolve", "hunt", "rest"。
    - 结合真实古生物学知识（寒武纪至现代）。
    `,

    getStartPrompt() {
        const epochKey = EPOCH_ORDER[gameState.currentEpochIndex];
        const epochInfo = EPOCH_DATA[epochKey];
        return `
        【指令：初始化游戏】
        玩家是 ${epochInfo.name} 的头足类幼体。
        【时代背景参考：${epochInfo.name}】
        - 最先进的动物(进化上限): ${epochInfo.advanced}
        - 最原始的动物(进化下限): ${epochInfo.primitive}
        
        当前状态：能量${gameState.energy}, 纪元进度${gameState.epochProgress}%, 进化进度${gameState.evolutionProgress}%。
        任务：输出开场剧情(story)，初始状态(status)，环境(environment)，以及【4个】选项(options)。
        务必返回纯净的 JSON 格式。
        `;
    },

    getNextTurnPrompt(option, result, currentDesc) {
        const epochKey = EPOCH_ORDER[gameState.currentEpochIndex];
        const epochInfo = EPOCH_DATA[epochKey];
        
        return `
        【指令：生成下一轮】
        【当前时代：${epochInfo.name}】
        【时代背景参考】
        - 最先进的动物(进化上限参考): ${epochInfo.advanced}
        - 最原始的动物(进化下限参考): ${epochInfo.primitive}

        玩家选择：'${option.title}' 
        ${result.specialEvent}

        === JS计算客观结果 ===
        1. 幸运：${result.luck}
        2. 能量变化：${result.energyChange} (当前: ${gameState.energy})
        3. 进化进度：+${result.evolutionProgressChange}%
        4. 纪元流逝：+${result.epochProgressChange}%
        5. '${option.target_system}' 提升: ${result.systemPointsChange} 点
        === 核心数值 ===
        ${JSON.stringify(gameState.systems)}

        === 当前状态 ===
        - 外壳: "${currentDesc.shell}"
        - 繁衍: "${currentDesc.spawning}"
        - 神经: "${currentDesc.neuro}"
        - 动力: "${currentDesc.power}"
        - 代谢: "${currentDesc.metabolism}"
        任务：
        1. 创作'story'，紧密结合玩家的选择和时代背景。
        2. 更新'status'和'environment'。
        3. 设计【4个】全新'options' (含 type 和 target_system)。
        严格返回纯 JSON。
        `;
    }
};

// ================= 7. AI (通信层) =================
const AI = {
    async call(userPrompt) {
        const payload = {
            model: Config.MODEL_NAME,
            messages: [
                { role: "system", content: Prompts.System },
                ...gameState.history,
                { role: "user", content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 4096,
        };

        console.group("📡 发送给 AI 的请求");
        console.log(payload);
        console.groupEnd();

        const response = await fetch(Config.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Config.API_KEY}` },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        
        console.log("📥 AI 原始返回:", data);
        let content = data.choices[0].message.content;
        
        // --- ⭐ 全新的、更安全的解析逻辑开始 ⭐ ---
        let gameData;
        try {
            // 方案A: 尝试直接解析。如果AI很乖，这是最快最高效的。
            gameData = JSON.parse(content);
            console.log("✅ (方案A) JSON 直接解析成功!");

        } catch (e) {
            console.warn("⚠️ (方案A) 直接解析失败，尝试方案B (清洗Markdown)...", e.message);
            try {
                // 方案B: 清洗掉AI可能添加的Markdown标记，然后再解析。
                const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
                gameData = JSON.parse(cleanedContent);
                console.log("✅ (方案B) 清洗Markdown后解析成功!");

            } catch (e2) {
                console.error("❌ (方案B) 清洗后依然解析失败，尝试方案C (暴力提取)...", e2.message);
                try {
                    // 方案C: 作为最后的手段，暴力提取第一个 '{' 和最后一个 '}' 之间的内容。
                    // 这能处理 "好的，这是JSON：{...}" 这种情况。
                    const startIndex = content.indexOf('{');
                    const endIndex = content.lastIndexOf('}');
                    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                        const jsonStr = content.substring(startIndex, endIndex + 1);
                        gameData = JSON.parse(jsonStr);
                        console.log("✅ (方案C) 暴力提取JSON成功!");
                    } else {
                        throw new Error("在内容中找不到有效的JSON结构。");
                    }
                } catch (e3) {
                    // 如果所有方案都失败了，就彻底放弃。
                    console.error("❌ 所有JSON解析方案均告失败！请检查AI返回的原始 content。");
                    console.error("原始 Content:", content);
                    // 抛出最终的错误，让上层逻辑（如Controller）去处理UI报错。
                    throw new Error("AI返回了无法解析的数据格式。");
                }
            }
        }
        // --- ⭐ 解析逻辑结束 ⭐ ---
        
        // 更新历史记录
        this._updateHistory(userPrompt, JSON.stringify(gameData));
        
        return gameData;
    },

    _updateHistory(userMsg, assistantMsg) {
        gameState.history.push({ role: "user", content: userMsg });
        gameState.history.push({ role: "assistant", content: assistantMsg });
        // 保持历史窗口大小
        if (gameState.history.length > 8) {
            gameState.history.splice(0, 2);
        }
    }
};

// ================= 8. LOGIC (游戏核心逻辑) =================
const GameLogic = {
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,

    calculateOutcome(option) {
        const luck = this.random(0, 100);
        let eChange = 0, evoChange = 0, sysChange = 0;
        const epochChange = this.random(10, 20);

        switch (option.type) {
            case 'evolve':
                eChange = -this.random(20, 30);
                evoChange = this.random(10, 25);
                sysChange = this.random(10, 20);
                if (luck > 75) evoChange += 5;
                if (luck < 20) evoChange = Math.floor(evoChange / 2);
                break;
            case 'hunt':
                eChange = this.random(15, 30);
                evoChange = this.random(5, 15);
                sysChange = this.random(3, 7);
                if (luck > 75) eChange += 15;
                if (luck < 20) eChange = Math.floor(eChange / 3);
                break;
            case 'rest':
                eChange = this.random(8, 15);
                evoChange = this.random(5, 15);
                sysChange = this.random(2, 5);
                if (luck < 20) eChange = Math.floor(eChange / 3);
                break;
            default:
                eChange = -5;
        }

        return { luck, eChange, evoChange, epochChange, sysChange };
    },

    handleMassExtinction() {
        const currentEpochKey = EPOCH_ORDER[gameState.currentEpochIndex];
        const eventText = EPOCH_DATA[currentEpochKey].event;
        UI.showMajorEvent(eventText);

        const survivalChance = (gameState.adaptability * 0.6 + gameState.luck * 0.4) / 100;
        const roll = Math.random();
        
        console.log(`大灭绝事件: ${eventText} | 适应度: ${gameState.adaptability}, 幸运: ${gameState.luck} | 生存概率: ${survivalChance.toFixed(2)}, 投骰: ${roll.toFixed(2)}`);

        if (roll < survivalChance) {
            gameState.energy = Math.max(10, Math.floor(gameState.energy * 0.5)); // 幸存但元气大伤
            return true;
        } else {
            gameState.energy = 0; // 灭绝
            return false;
        }
    },

    applyChanges(option, result) {
        if (option.target_system && gameState.systems[option.target_system] !== undefined) {
            gameState.systems[option.target_system] = Math.min(100, gameState.systems[option.target_system] + result.sysChange);
        }

        gameState.energy = Math.min(gameState.maxEnergy, Math.max(0, gameState.energy + result.eChange));
        gameState.evolutionProgress += result.evoChange;
        gameState.epochProgress += result.epochChange;
        gameState.luck = result.luck;

        let specialEvent = "";

        if (gameState.evolutionProgress >= gameState.maxEvolutionProgress) {
            gameState.evolutionProgress = 0; // or apply some bonus and reset partially
            specialEvent += "【系统提示：进化进度条已满！物种发生关键跃迁！】";
        }
        
        // **核心纪元推进逻辑**
        if (gameState.epochProgress >= gameState.maxEpochProgress) { // 检查纪元进度是否已满100%
            
            // 1. 触发大事件和生存判定
            const survived = this.handleMassExtinction();
            
            if (survived) {
                // 2. 进度条归零，进入下一个纪元
                gameState.epochProgress = 0;
                gameState.currentEpochIndex++;

                // 3. 准备要告诉AI发生了什么
                if (gameState.currentEpochIndex >= EPOCH_ORDER.length) {
                    gameState.currentEpochIndex = EPOCH_ORDER.length - 1; // 到达终点
                    specialEvent += "【系统提示：你已抵达时间的尽头，见证了整个显生宙的宏伟！】";
                } else {
                    const newEpochName = EPOCH_DATA[EPOCH_ORDER[gameState.currentEpochIndex]].name;
                    specialEvent += `【大灭绝幸存！你进入了全新的 **${newEpochName}**！】`;
                }
            } else {
                // 灭绝后，游戏结束逻辑会在 Controller 中处理
                specialEvent += `【你的物种未能熬过大灭绝，基因消散在时间长河中...】`;
            }
        }

        return specialEvent;
    },

    isGameOver() {
        return gameState.energy <= 0;
    }
};

// ================= 8. CONTROLLER (流程主控) =================
const Controller = {
    async init() {
        console.clear();
        console.log("%c 🚀 游戏初始化启动 (v3.0 Epoch)...", "color: #00ff00; font-weight: bold;");
        
        const savedState = await Storage.load();

        // --- ⭐ 修复逻辑开始 ⭐ ---
        // 检查存档是否存在，以及是否兼容当前版本（是否有 currentEpochIndex 字段）
        if (savedState && savedState.currentEpochIndex !== undefined) {
            gameState = savedState;
            console.log("✅ 存档加载成功，版本兼容。");
            
            UI.renderBars();
            document.getElementById('story-text').innerHTML = "读取上一次的记忆... [存档已加载]";
            
            // 恢复 UI
            if (gameState.history.length > 0) {
                const lastResponse = JSON.parse(gameState.history[gameState.history.length - 1].content);
                UI.renderStatus(lastResponse);
                UI.renderOptions(lastResponse.options);
            }
        } else {
            // 如果没有存档，或者存档是旧版本的（没有 currentEpochIndex）
            if (savedState) {
                console.warn("⚠️ 检测到旧版本存档，数据结构不兼容，正在重置新游戏...");
                await Storage.clear(); // 清除旧存档
            } else {
                console.log("🆕 未找到存档，开始新游戏。");
            }

            // 重置为初始状态
            gameState = JSON.parse(JSON.stringify(INITIAL_STATE)); 
            
            UI.renderBars();
            document.getElementById('story-text').innerHTML = "正在建立神经链接... (等待 AI 响应)";
            
            try {
                const gameData = await AI.call(Prompts.getStartPrompt());
                this._updateGameScene(gameData);
                await Storage.save(gameState);
            } catch (e) {
                UI.showError(e.message);
            }
        }
        // --- ⭐ 修复逻辑结束 ⭐ ---
    },

    async handleOptionSelection(option) {
        if (!option.type || !option.target_system) {
            alert("AI 数据缺失，请检查 Prompt");
            return;
        }

        if (option.type === 'evolve' && gameState.energy < 10) {
            alert("能量过低，无法进化！");
            return;
        }

        // 1. 计算数值结果
        const result = GameLogic.calculateOutcome(option);
        
        // 2. 应用数值到 State
        const specialEvent = GameLogic.applyChanges(option, result);
        
        // 3. 检查游戏结束
        if (GameLogic.isGameOver()) {
            UI.renderBars(); // 更新最后的能量条为0
            alert("能量耗尽或未能熬过大灭绝，你的基因序列在时间长河中消散... (点击确定重新开始)");
            await Storage.clear();
            location.reload();
            return;
        }

        // 4. 更新UI反馈
        UI.renderBars();
        UI.renderLuckFeedback(
            result.luck, option.title, result.eChange, 
            result.evoChange, result.epochChange, 
            option.target_system, result.sysChange
        );

        // 5. 准备下一轮请求
        UI.showLoading();
        const currentDesc = UI.getCurrentStatusDescriptions();
        const prompt = Prompts.getNextTurnPrompt(option, {
            ...result,
            energyChange: result.eChange,
            evolutionProgressChange: result.evoChange,
            epochProgressChange: result.epochChange,
            systemPointsChange: result.sysChange,
            specialEvent
        }, currentDesc);

        // 6. 调用 AI 并保存
        try {
            const gameData = await AI.call(prompt);
            this._updateGameScene(gameData);
            await Storage.save(gameState);
        } catch (e) {
            console.error(e);
            UI.showError(e.message);
        }
    },

    _updateGameScene(data) { // 这是 Controller 里的函数，但逻辑相关
        UI.hideLoading(); // 在这里调用是最佳实践，确保任何更新前都清除加载状态
        UI.renderStatus(data);
        UI.renderOptions(data.options); 
    },

    async resetGame() {
        if (confirm("确定要清除存档并重新开始吗？")) {
            await Storage.clear();
            location.reload();
        }
    },

    // 👇 新增 handleReroll 函数 👇
    async handleReroll() {
        if (gameState.history.length < 2) {
            alert("还没有对话记录，无法重生成！");
            return;
        }

        const btn = document.getElementById('btn-reroll');
        const originalText = btn.innerHTML; // 保存原本的按钮文字
        btn.disabled = true;
        btn.innerHTML = "⏳ 重写中...";

        // 1. 回滚历史记录 (弹出最后两条：AI回复 和 触发该回复的用户指令)
        const lastAiMsg = gameState.history.pop(); 
        const lastUserMsgObj = gameState.history.pop(); 

        // 2. 准备重发用户的指令
        const promptToResend = lastUserMsgObj.content;

        UI.showLoading(); 

        try {
            console.log("🔄 正在请求 AI 重写...");
            // 3. 再次调用 AI (AI.call 会自动把 User指令 和 新AI回复 塞回 history)
            const gameData = await AI.call(promptToResend);
            
            // 4. 更新画面并保存
            this._updateGameScene(gameData);
            await Storage.save(gameState);

        } catch (e) {
            console.error("重生成失败", e);
            UI.showError("重生成失败: " + e.message);
            
            // 失败了就把记录塞回去，防止坏档
            gameState.history.push(lastUserMsgObj);
            gameState.history.push(lastAiMsg);
        } finally {
            // 5. 恢复按钮
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },
    // 👆 新增结束 👆
};




// ================= 启动绑定 =================
window.onload = () => {
    document.getElementById('reset-button').addEventListener('click', () => Controller.resetGame());
    
    // 👇 新增这一行绑定 👇
    document.getElementById('btn-reroll').addEventListener('click', () => Controller.handleReroll());
    
    Controller.init();
};