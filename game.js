let articleData;

let levelIndex = -1;
const levels = [
    "intro",
    "corrupt-guard",
    "chemicals",
    "war",
    "refugees",
    "riot",
    "victory"
];

let audio;

let stats = {
    publicApproval: 50,
    governmentApproval: 50,
    economy: 50,
    health: 50
};

async function start() {
    levelIndex = -1;
    stats = {
        publicApproval: 50,
        governmentApproval: 50,
        economy: 50,
        health: 50
    };
    await next();
}

async function next() {

    levelIndex++;

    const levelName = (
        stats.governmentApproval == 0
        || stats.publicApproval == 0
        || stats.economy == 0
        || stats.health == 0
    ) 
        ? "/game-over.json"
        : `/${levels[levelIndex]}.json`;

    const response = await fetch(
      levelName,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
        document.body.innerText = "There was an error loading data.";
        throw new Error(`Error! status: ${response.status}`);
    }
    articleData = await response.json();
    displayArticle();
}

function displayArticle() {

    taskElement.style.display = articleData.task ? "" : "none";
    taskElement.innerText = articleData.task;

    clear(articleTextElement);
    for (let entry of articleData.article) {
        if (typeof entry === 'string' || entry instanceof String) {
            const span =  document.createElement("span");
            span.innerText = entry;
            articleTextElement.appendChild(span);
        } else {
            const choice = document.createElement("span");
            const options = Object.entries(entry.options);
            choice.id = entry.id;
            choice.dataset.index = 0;
            updateChoice(choice, options);
            choice.onclick = () => rotate(choice, options);
            articleTextElement.appendChild(choice);
        }
    }

    newspaperButtonRowElement.style.display = "";
    feedbackElement.style.display = "none";
    switch (articleData.action) {
        case "NEXT":
            statsElement.style.display = "none";
            newspaperButtonElement.innerText = "Next";
            newspaperButtonElement.onclick = () => {
                if (!audio) {
                    audio = new Audio('music.mp3');
                    audio.loop = true;
                }
                audio.play();
                next();
            };
            break;
        case "RESTART":
            audio?.pause();
            updateStats({});
            statsElement.style.display = "";
            newspaperButtonElement.innerText = "Restart";
            newspaperButtonElement.onclick = () => {
                navigation.navigate("/");
            };
            break;
        default:
            updateStats({});
            statsElement.style.display = "";
            newspaperButtonElement.innerText = "Publish";
            newspaperButtonElement.onclick = publish;
            break;
    }
}

function rotate(choice, options) {
    let index = Number(choice.dataset.index);
    index = (index + 1) % options.length;
    choice.dataset.index = index;
    updateChoice(choice, options);
}

function updateChoice(choice, options) {
    const index = Number(choice.dataset.index);
    let text;
    [choice.dataset.value, text] = options[index];
    const lie = text.startsWith("(Lie)");
    if (lie) {
        text = text.substring(5).trim();
    }
    choice.className = lie ? "lie" : "truth";
    choice.innerText = text;
}

function updateStats(statChanges){

    for (let [key, _] of [...Object.entries(stats)]) {

        const delta = statChanges[key];
        if (delta) {
            statChangeElements[key].innerText = `${(delta <= 0 ? "" : "+")}${delta}%`;
            statChangeElements[key].style.color = delta <= 0 ? "orange" : "green";
            stats[key] += delta;
            if (stats[key] < 0) {
                stats[key] = 0;
            } else if (stats[key] > 100){
                stats[key] = 100;
            }
        }
        else {
            statChangeElements[key].innerText = "";
        }
        
        statsElements[key].innerText = `${stats[key]}%`;
    }
}

function publish() {

    feedbackElement.style.display = "";

    let outcomes = [];

    for (let [condition, outcome] of Object.entries(articleData.outcomes)) {

        let conditionMet = true;

        for (let subCondition of condition.split("&")){
            const subConditionParts = subCondition.split(":");

            if (subConditionParts.length != 2) {
                throw new Error(`subConditionParts.length was not 2! subConditionParts: ${subConditionParts}`);
            }

            choiceId = subConditionParts[0].trim();
            optionIds = subConditionParts[1].split("|").map(optionId => optionId.trim());

            const subConditionMet = optionIds.includes(document.getElementById(choiceId).dataset.value);

            if (!subConditionMet) {
                conditionMet = false;
            }
        }

        if (conditionMet) {
            outcomes.push(outcome);
        }
    }

    handleOutcomes(outcomes.length == 0 ? [{
        message: "Nothing to see here.",
        statChanges: {
            governmentApproval: 10
        }
    }] : outcomes);
}

function handleOutcomes(outcomes) {

    clear(feedbackTextElement);
    newspaperButtonRowElement.style.display = "none";

    feedbackElement.style.display = "";
    feedbackTextElement.innerText = outcomes.map(outcome => outcome.message).join("\n");

    for (let elem of [...document.getElementsByClassName("choice")]) {
        elem.classList.remove("choice");
        elem.onclick = null;
    }

    let statChanges = {};
    for (let outcome of outcomes) {
        for (let [key, value] of Object.entries(outcome.statChanges)) {
            statChanges[key] = (statChanges[key] ?? 0) + value;
        }
    }

    updateStats(statChanges);
}