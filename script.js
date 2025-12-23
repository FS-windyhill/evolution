// ================= 配置区 =================
const API_KEY = 'sk-tfffxwslxkgzwhvnwyrxodmfzjwhklmbwefovkdpvektnioi'; // 填入你的 Key
const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'; // 填入你的反代地址
const MODEL_NAME = 'deepseek-ai/DeepSeek-V3.2';


/*
const API_KEY = 'geminiyl'; // 填入你的 Key
const API_URL = 'https://geminiyl.zeabur.app/v1/chat/completions'; // 填入你的反代地址
const MODEL_NAME = 'gemini-2.5-flash';
*/

// ================= 游戏状态核心 =================
let gameState = {
    energy: 85,
    maxEnergy: 100,
    evolutionProgress: 0,
    maxEvolutionProgress: 100,
    epochProgress: 15,
    maxEpochProgress: 100,
    epochName: "奥陶纪早期",
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


// ⭐ [存档系统] 新增：IndexedDB 存档模块
// ================= 存档系统 (IndexedDB) =================
const DB_NAME = 'CephalopodEvolutionDB';
const STORE_NAME = 'gameStateStore';
const DB_VERSION = 1;

// 1. 打开数据库
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => reject("数据库打开失败");
        request.onsuccess = (event) => resolve(event.target.result);
        // 首次创建或版本升级时触发
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                console.log("IndexedDB 对象仓库创建成功！");
            }
        };
    });
}

// 2. 保存游戏状态
async function saveGameState(state) {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        // 我们用一个固定的id来存储唯一的游戏状态
        store.put({ id: 'current', ...state });
        console.log("💾 游戏状态已成功保存至 IndexedDB。");
    } catch (error) {
        console.error("存档失败:", error);
    }
}

// 3. 读取游戏状态
async function loadGameState() {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('current');

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                if (request.result) {
                    console.log("✅ 成功从 IndexedDB 加载存档。");
                    // 删除id字段，因为它只是用来存储的key
                    delete request.result.id;
                    resolve(request.result);
                } else {
                    console.log("未找到存档，将开始新游戏。");
                    resolve(null);
                }
            };
            request.onerror = (event) => reject("读取存档失败");
        });
    } catch (error) {
        console.error("读档失败:", error);
        return null;
    }
}

// 4. 清除游戏状态 (用于初始化)
async function clearGameState() {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        console.log("🗑️ 存档已清除。");
    } catch (error) {
        console.error("清除存档失败:", error);
    }
}

// ⭐ [存档系统] 新增：重置游戏的功能
async function resetGame() {
    const confirmed = confirm("您确定要清除所有本地存档并重新开始游戏吗？这个操作不可逆！");
    if (confirmed) {
        await clearGameState();
        alert("存档已清除，页面将刷新以开始新游戏。");
        location.reload();
    }
}


// ================= 辅助函数：生成范围随机数 =================
function getRandomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ================= 1. 游戏初始化 =================
// ⭐ [存档系统] 核心修改：initGame 现在会先尝试加载存档
async function initGame() {
    console.clear();
    console.log("%c 🚀 游戏初始化启动 (v2.1 存档版)...", "color: #00ff00; font-weight: bold;");

    const savedState = await loadGameState();

    if (savedState) {
        // 如果有存档，则加载存档数据
        gameState = savedState;
        updateUI();
        document.getElementById('story-text').innerHTML = "读取上一次的记忆... [存档已加载]";

        // 恢复上一次的UI显示
        const lastAssistantResponse = JSON.parse(gameState.history[gameState.history.length - 1].content);
        renderGameData(lastAssistantResponse);

    } else {
        // 如果没有存档，则正常开始新游戏
        updateUI();
        document.getElementById('story-text').innerHTML = "正在建立神经链接... (等待 AI 响应)";
        const startPrompt = `
        【指令：初始化游戏】
        玩家是奥陶纪头足类幼体。
        当前状态：能量85, 纪元进度15%, 进化进度0%。
        任务：输出开场剧情(story)，初始状态(status)，环境(environment)，以及【4个】选项(options)。
        要求：options里的type必须是 'evolve', 'hunt', 'rest' 之一。
        务必返回纯净的 JSON 格式。
        `;
        await callAI(startPrompt);
    }
}

// ================= 2. 核心逻辑：数值计算 =================
async function handleOption(option) {
    // ... 此函数内部逻辑保持不变，我只在末尾 callAI 成功后增加一个保存点
    if (!option.type || !option.target_system) {
        alert("AI返回的选项数据不完整，缺少 type 或 target_system。请检查Prompt。");
        return;
    }
    if (option.type === 'evolve' && gameState.energy < 20) {
        alert("能量过低，无法支撑激烈的进化，先去捕食或休息吧！");
        return;
    }
    const luck = getRandomInRange(0, 100);
    let energyChange = 0;
    let evolutionProgressChange = 0;
    const epochProgressChange = getRandomInRange(3, 7);
    let systemPointsChange = 0;
    switch (option.type) {
        case 'evolve':
            energyChange = -getRandomInRange(20, 30);
            evolutionProgressChange = getRandomInRange(10, 20);
            systemPointsChange = getRandomInRange(8, 15);
            if (luck > 90) systemPointsChange += 5;
            if (luck < 10) systemPointsChange = Math.floor(systemPointsChange / 2);
            break;
        case 'hunt':
            energyChange = getRandomInRange(20, 30);
            evolutionProgressChange = getRandomInRange(2, 5);
            systemPointsChange = getRandomInRange(2, 4);
            if (luck > 85) energyChange += 15;
            if (luck < 15) energyChange = Math.floor(energyChange / 3);
            break;
        case 'rest':
            energyChange = getRandomInRange(8, 15);
            evolutionProgressChange = getRandomInRange(0, 1);
            systemPointsChange = getRandomInRange(1, 3);
            if (luck < 15) energyChange = 0;
            break;
        default:
            energyChange = -5;
    }
    if (option.target_system && gameState.systems[option.target_system] !== undefined) {
        gameState.systems[option.target_system] += systemPointsChange;
        gameState.systems[option.target_system] = Math.min(100, gameState.systems[option.target_system]);
    } else {
        console.warn(`AI提供了无效的target_system: ${option.target_system}`);
    }
    gameState.energy += energyChange;
    if (gameState.energy <= 0) {
        alert("能量耗尽，你的基因序列在时间长河中消散... (点击确定重新开始)");
        // ⭐ [存档系统] 游戏结束后清除存档
        await clearGameState();
        location.reload();
        return;
    }
    gameState.energy = Math.min(gameState.maxEnergy, gameState.energy);
    gameState.evolutionProgress += evolutionProgressChange;
    gameState.epochProgress += epochProgressChange;
    gameState.luck = luck;
    let specialEvent = "";
    if (gameState.epochProgress >= gameState.maxEpochProgress) {
        gameState.epochProgress = 0;
        specialEvent += "【系统提示：纪元进度条已满，时代洪流不可阻挡！强制进入下一个地质时期！请在剧情中描述环境的剧烈变迁！】";
    }
    if (gameState.evolutionProgress >= gameState.maxEvolutionProgress) {
        gameState.evolutionProgress = 0;
        specialEvent += "【系统提示：进化进度条已满！物种发生了关键性的跃迁！请在剧情中描述一次重大的身体结构或能力的进化！】";
    }
    updateUI();
    renderLuckFeedback(luck, option.title, energyChange, evolutionProgressChange, epochProgressChange, option.target_system, systemPointsChange);
    const currentStatusDesc = {
        shell: document.getElementById('stat-shell').innerText,
        spawning: document.getElementById('stat-spawning').innerText,
        neuro: document.getElementById('stat-neuro').innerText,
        power: document.getElementById('stat-power').innerText,
        sense: document.getElementById('stat-sense').innerText
    };
    const prompt = `
    【指令：生成下一轮】
    玩家选择：'${option.title}' (类型: ${option.type}, 目标系统: ${option.target_system})
    ${specialEvent}
    === JS计算的客观结果 ===
    1. 本轮幸运：${luck}/100
    2. 能量变化：${energyChange} (当前: ${gameState.energy})
    3. 进化总进度推进：+${evolutionProgressChange}%
    4. 纪元时间流逝：+${epochProgressChange}%
    5. 【关键】'${option.target_system}'系统提升了 ${systemPointsChange} 点!
    === 当前生物核心系统数值 ===
    - neuro (感知): ${gameState.systems.neuro}
    - structure (结构): ${gameState.systems.structure}
    - motor (动力): ${gameState.systems.motor}
    - metabolism (代谢): ${gameState.systems.metabolism}
    - reproduction (生殖): ${gameState.systems.reproduction}
    === 当前生物的状态描述 (请基于此进行演化，不要凭空生成) ===
    - 外壳形态: "${currentStatusDesc.shell}"
    - 繁衍方式: "${currentStatusDesc.spawning}"
    - 神经结构: "${currentStatusDesc.neuro}"
    - 动力系统: "${currentStatusDesc.power}"
    - 感官能力: "${currentStatusDesc.sense}"
    任务：
    1. 基于以上【所有】信息创作'story'，确保剧情和状态描述的连续性。
    2. 基于玩家的选择和数值变化，更新'status'和'environment'。
    3. 设计【4个】全新的'options'。每个option都必须同时包含 'type' 和 'target_system' 字段。
    请严格返回纯净的 JSON 格式。
    `;
    document.getElementById('options-container').innerHTML = '<div style="text-align:center; padding:20px; color:#8ecae6;">🌌 生命的蓝图正在绘制...</div>';
    await callAI(prompt);
}

// ================= 3. AI 通信模块 =================
async function callAI(userPrompt) {
    // ... System Prompt 保持不变 ...
    const systemPrompt = `
    # Role
    你是一个名为“头足纲进化模拟器”的游戏引擎，负责生成富有想象力和科学依据的游戏内容。

    # Output Format
    你必须严格只输出纯 JSON 字符串，绝不能包含任何 Markdown 标记 (如 \`\`\`json) 或其他解释性文本。

    # Core Gameplay Systems
    游戏现在有一个核心的【生命系统】面板，包含5大系统。这是进化的核心。
    1.  **neuro**: 感知·神经。影响索敌、环境感知、决策能力。
    2.  **structure**: 结构·防御。影响外壳、身体韧性、生存能力。
    3.  **motor**: 动力·运动。影响速度、攻击力、捕食效率。
    4.  **metabolism**: 代谢·循环。影响能量吸收效率、耐力、恢复速度。
    5.  **reproduction**: 生殖·繁衍。传递基因的能力。

    # JSON Structure
    {
      "story": "一段富有诗意、第二人称视角的剧情描述（约50-100字）。",
      "status": { "shell_desc": "比如...直锥形(8cm)...", "spawning_desc": "比如...体外精团抛洒...", "neuro_desc": "比如...基本避光性...", "power_desc": "比如...原始喷水...", "sense_desc": "比如...分散神经节..." },
      "environment": { "location": "...", "threat": "...", "opportunity": "...", "prey": "..." },
      "options": [ 
        { "title": "选项1标题", "desc": "选项1描述", "type": "根据内容，从evolve/hunt/rest选一个" ,"target_system": "根据内容，从neuro/structure/motor/metabolism/reproduction选一个"},
        { "title": "选项2标题", "desc": "选项2描述", "type": "根据内容，从evolve/hunt/rest选一个" ,"target_system": "根据内容，从neuro/structure/motor/metabolism/reproduction选一个"},
        // ... 另外两个选项同理 ...
      ]
    }
    
    # Core Gameplay Rules
    - 你必须生成【4个】选项。
    - 每个选项的 'type' 字段必须是 "evolve", "hunt", "rest" 三者之一。
    - "evolve": 进化选项，是游戏的核心。它会【消耗】能量，但能【推进】进化进度。
    - "hunt": 捕食选项。它会【增加】能量，是能量的主要来源。
    - "rest": 休息选项。它会【少量恢复】能量，用于规避风险。
    - 你不需要计算 cost_desc，前端会自己显示结果。
    - 你的'story'和'status'描述，应该要能反映出当前各项数值高低。


    # World Info & Creative Guidelines
    1.  **科学幻想**：基于真实的古生物学（下方知识库），但允许诗意的、沉浸式的叙事。
    2.  **响应性**：
        - 如果JS结果显示【幸运值极低】，描述一次失败、受伤或危险的遭遇。
        - 如果JS结果显示【幸运值极高】，描述一次意外的收获、发现或进化上的突破。
        - 如果JS结果触发了【纪元更迭】，必须根据真实纪元历史描述环境变迁，如海平面升降、新物种诞生、旧物种灭绝。
        - 如果JS结果触发了【进化跃迁】，必须描述一个关键器官的质变。
    3.  **平衡性**：确保你设计的4个选项各有吸引力，不要出现某个选项明显优于其他所有选项的情况。例如，可以设计一个高消耗高回报的进化选项，和一个低消耗低回报的进化选项。
    
    # 知识库
    ##寒武纪 (5.4亿 - 4.85亿年前)
    海洋温度较高。
    几乎所有现代动物门类出现（“寒武纪大爆发”）。
    奇虾等顶级掠食者称霸。
    最早的脊椎动物（如昆明鱼）出现。

    ##奥陶纪 (4.85亿 - 4.44亿年前)
    海平面极高，气候温暖。
    头足纲（鹦鹉螺 relatives）成为顶级掠食者（巨物！）。
    珊瑚礁开始形成，鱼类增多。
    末期大灭绝： 全球变冷，冰川形成，海平面骤降。

    ##志留纪 (4.44亿 - 4.19亿年前)
    气候回暖，海平面回升。
    有颌鱼类崛起（新对手！）。
    节肢动物和植物开始尝试登陆。

    ##泥盆纪 (4.19亿 - 3.59亿年前)
    海洋温暖，常缺氧。
    鱼类统治海洋（盾皮鱼、鲨鱼 ancestors）。
    菊石出现！
    陆地森林出现。
    晚期大灭绝： 可能因全球变冷/藻类暴发。

    ##石炭纪 (3.59亿 - 2.99亿年前)
    氧气含量极高（35%！）。
    陆地上巨型昆虫繁盛。
    鲨鱼和硬骨鱼繁盛。
    爬行动物出现。

    ##二叠纪 (2.99亿 - 2.52亿年前)
    盘古大陆形成，海岸线减少。
    海洋盐度变化，环流改变。
    爬行动物称霸陆地。
    末期大灭绝： 地球史上最惨烈（96%海洋生物灭绝），主因：超级火山、变暖、缺氧、酸化。

    ##三叠纪 (2.52亿 - 2.01亿年前)
    气候炎热干燥。
    海洋生态位空虚，生物复苏。
    鱼龙、蛇颈龙（海爬）成为新对手。
    晚期大灭绝： 未知原因（可能火山），为恐龙崛起铺路。

    ##侏罗纪 (2.01亿 - 1.45亿年前)
    气候温暖，海平面上升。
    恐龙称霸陆地，海爬统治浅海。
    菊石的黄金时代（种类极多）。
    最早的章鱼、鱿鱼 relatives 出现！

    ##白垩纪 (1.45亿 - 6600万年前)
    气候极温暖，海平面很高。
    海洋中“海爬+鲨鱼+硬骨鱼”多方争霸。
    菊石依然繁盛。
    末期大灭绝： 小行星撞击，全球寒冬，菊石等大部灭绝。


    ##古近纪 (6600万 - 2300万年前)
    气候先暖后渐冷。
    鲸类（哺乳动物）下海，成为新顶级掠食者。
    现代鱼类（真骨鱼）辐射进化。
    菊石灭绝，但蛸类（章鱼、乌贼）幸存并开始适应。


    ##中新世 - 现代 (2300万年前 - 至今)
    极地冰盖形成，气候变冷变干。
    海洋食物链高度复杂。
    人类出现，过度捕捞和污染成为新威胁。
    `;

    const requestPayload = {
        model: MODEL_NAME,
        messages: [
            { role: "system", content: systemPrompt },
            ...gameState.history,
            { role: "user", content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4096,
    };

    console.group("📡 发送给 AI 的请求 (v2.1)");
    console.log(requestPayload);
    console.groupEnd();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);

        const data = await response.json();
        console.log("📥 AI 原始返回:", data);

        let content = data.choices[0].message.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace === -1 || lastBrace === -1) throw new Error("AI 返回内容中未找到有效的 JSON 对象");
        content = content.substring(firstBrace, lastBrace + 1);

        const gameData = JSON.parse(content);
        console.log("✅ JSON 解析成功:", gameData);

        gameState.history.push({ role: "user", content: userPrompt });
        gameState.history.push({ role: "assistant", content: JSON.stringify(gameData) });
        if (gameState.history.length > 8) {
            gameState.history.splice(0, 2);
        }

        renderGameData(gameData);

        // ⭐ [存档系统] 核心修改：在成功处理AI响应后，保存游戏状态！
        await saveGameState(gameState);

    } catch (error) {
        console.error("🚨 发生严重错误:", error);
        document.getElementById('story-text').innerText = `⚠️ 错误: ${error.message}。请检查控制台(F12)获取详细信息。`;
        document.getElementById('options-container').innerHTML = `<div style="color: #ff5555; text-align: center;"><button onclick="initGame()">点击重试</button></div>`;
    }
}

// ================= 4. UI 渲染 =================
// ... 此部分所有函数 (renderGameData, updateUI, updateSystemsPanel, renderLuckFeedback) 保持不变 ...
function renderGameData(data) {
    document.getElementById('story-text').innerText = data.story;
    const status = data.status || {};
    document.getElementById('stat-shell').innerText = status.shell_desc || "未知";
    document.getElementById('stat-spawning').innerText = status.spawning_desc || "未知";
    document.getElementById('stat-neuro').innerText = status.neuro_desc || "未知";
    document.getElementById('stat-power').innerText = status.power_desc || "未知";
    document.getElementById('stat-sense').innerText = status.sense_desc || "未知";
    const environment = data.environment || {};
    document.getElementById('env-location').innerText = environment.location || "深海";
    document.getElementById('env-threat').innerHTML = `⚠️威胁： ${environment.threat || "无"}`;
    document.getElementById('env-opportunity').innerHTML = `🍀机遇： ${environment.opportunity || "无"}`;
    document.getElementById('env-prey').innerHTML = `🥘资源： ${environment.prey || "无"}`;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    if(data.options && data.options.length > 0) {
        data.options.forEach(opt => {
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
            btn.onclick = () => handleOption(opt);
            container.appendChild(btn);
        });
    } else {
        container.innerHTML = "<div>AI 未能生成有效选项，请尝试重试...</div>";
    }
}
function updateUI() {
    const systemValues = Object.values(gameState.systems);
    const systemAverage = systemValues.reduce((sum, current) => sum + current, 0) / systemValues.length;
    gameState.adaptability = Math.round((gameState.energy * 0.4) + (systemAverage * 0.6));
    document.getElementById('val-adaptability').innerText = gameState.adaptability;
    document.getElementById('bar-adaptability').style.width = `${gameState.adaptability}%`;
    document.getElementById('val-energy').innerText = `${gameState.energy}/${gameState.maxEnergy}`;
    document.getElementById('bar-energy').style.width = `${gameState.energy / gameState.maxEnergy * 100}%`;
    document.getElementById('current-energy-display').innerText = gameState.energy;
    document.getElementById('val-evolution').innerText = `${gameState.evolutionProgress}/${gameState.maxEvolutionProgress}`;
    document.getElementById('bar-evolution').style.width = `${gameState.evolutionProgress / gameState.maxEvolutionProgress * 100}%`;
    document.getElementById('val-epoch').innerText = gameState.epochName;
    document.getElementById('bar-epoch').style.width = `${gameState.epochProgress / gameState.maxEpochProgress * 100}%`;
    document.getElementById('hint-epoch').innerText = `时代洪流: ${gameState.epochProgress}%`;
    document.getElementById('val-luck').innerText = `${gameState.luck}/100`;
    document.getElementById('bar-luck').style.width = `${gameState.luck}%`;
    updateSystemsPanel();
}
function updateSystemsPanel() {
    const systems = gameState.systems;
    for (const key in systems) {
        const value = systems[key];
        const valElement = document.getElementById(`val-system-${key}`);
        const barElement = document.getElementById(`bar-system-${key}`);
        if (valElement && barElement) {
            valElement.innerText = `${value}/100`;
            barElement.style.width = `${value}%`;
        }
    }
}
function renderLuckFeedback(luck, actionTitle, energyDelta, evolutionDelta, epochDelta, targetSystem, systemPoints) {
    const feedbackBox = document.getElementById('luck-feedback');
    let color = luck > 75 ? '#2ecc71' : (luck < 25 ? '#ff5555' : '#8ecae6');
    let energySign = energyDelta >= 0 ? '+' : '';
    let systemFeedback = '';
    if (targetSystem && systemPoints > 0) {
        const systemNames = {
            neuro: '感知', structure: '结构', motor: '动力', metabolism: '代谢', reproduction: '生殖'
        };
        systemFeedback = ` | 🎯 ${systemNames[targetSystem] || targetSystem}: +${systemPoints}`;
    }
    feedbackBox.innerHTML = `
        <div style="border-left: 3px solid ${color}; padding-left: 10px;">
            <div><b>上轮抉择：</b>${actionTitle}</div>
            <div style="color:${color}"><b>🎲 幸运判定: ${luck}</b></div>
            <div>⚡ 能量: ${energySign}${energyDelta} | 🧬 进化: +${evolutionDelta}%${systemFeedback}</div>
            <div>🌍 纪元流逝: +${epochDelta}%</div>
        </div>
    `;
}

// ================= 5. 启动游戏 =================
window.onload = () => {
    // ⭐ [存档系统] 页面加载后，为重置按钮绑定事件
    document.getElementById('reset-button').addEventListener('click', resetGame);
    initGame();
};