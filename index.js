let taskElement;
let newspaperElement;
let statsElements;
let extraStatsElements;
let articleData;
let feedbackElement;
let button;

const stats = {
    publicApproval: 50,
    governmentApproval: 50,
    economy: 50,
    health: 50
};

let levelIndex = -1;
const levels = [
    "corrupt-guard",
    "chemicals",
    "war",
    "refugees"
];

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

function clear(element){
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
}

async function next() {

    levelIndex++;

    clear(newspaperElement);

    updateStats({});

    newspaperElement.innerText = "Loading...";

    const response = await fetch(
      `./${levels[levelIndex]}.json`,
      {
        method: 'GET',
      },
    );

    if (!response.ok) {
        document.body.innerText = "There was an error loading data.";
        throw new Error(`Error! status: ${response.status}`);
    }

    articleData = await response.json();

    taskElement.style.display = articleData.task ? "" : "none";
    taskElement.innerText = articleData.task;

    feedbackElement.style.display = "none";

    newspaperElement.innerText = "";

    for (let entry of articleData.article) {
        if (typeof entry === 'string' || entry instanceof String) {
            const span =  document.createElement("span");
            span.innerText = entry;
            newspaperElement.appendChild(span);
        } else {
            const choice = document.createElement("span");
            const options = Object.entries(entry.options);
            choice.id = entry.id;
            choice.dataset.index = 0;
            updateChoice(choice, options);
            choice.onclick = () => rotate(choice, options);
            newspaperElement.appendChild(choice);
        }
    }

    newspaperElement.appendChild(document.createElement("br"));

    createOrOrphanButton();
    button.innerText = "Publish";
    button.onclick = check;
    newspaperElement.appendChild(button);
}

function createOrOrphanButton(){
    if (button) {
        button.parentElement.removeChild(button);
    } else {
        button = document.createElement("button");
    }
}

async function check() {

    let message = document.getElementById("message");
    if (message) {
        message.parentElement.removeChild(message);
    }

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
    
    clear(feedbackElement);
    feedbackElement.style.display = "";
    feedbackElement.innerText = outcomes.map(outcome => outcome.message).join("\n");
    createOrOrphanButton();
    button.innerText = "Next";
    button.onclick = next;
    feedbackElement.appendChild(document.createElement("br"));
    feedbackElement.appendChild(button);

    for (let elem of [...document.getElementsByClassName("choice")]) {
        elem.classList.remove("choice");
        elem.onclick = null;
        elem.innerText = elem.innerText.replace("(Lie)",'').replace("(Truth)",'').trim();
    }

    let statChanges = {};
    for (let outcome of outcomes) {
        for (let [key, value] of Object.entries(outcome.statChanges)) {
            statChanges[key] = (statChanges[key] ?? 0) + value;
        }
    }

    updateStats(statChanges);
}

async function start() {

    clear(document.body);

    taskElement = document.createElement("div");
    taskElement.classList.add("paper");
    taskElement.classList.add("pink");
    taskElement.id = "task";
    taskElement.style.display = "none";
    document.body.appendChild(taskElement);

    newspaperElement = document.createElement("div");
    newspaperElement.classList.add("paper");
    newspaperElement.classList.add("newspaper");
    newspaperElement.id = "newspaper";
    document.body.appendChild(newspaperElement);

    feedbackElement = document.createElement("div");
    feedbackElement.classList.add("paper");
    feedbackElement.classList.add("yellow");
    feedbackElement.id = "feedback";
    feedbackElement.style.display = "none";
    document.body.appendChild(feedbackElement);

    next();
}

function updateStats(statChanges){

    console.log({statChanges});

    if (!statsElements) {

        const tableElement = document.createElement("table");
        tableElement.classList.add("paper");
        tableElement.classList.add("yellow");
        tableElement.id = "stats";

        statsElements = {};
        extraStatsElements = {};

        for (let [key, _] of Object.entries(stats)) {
            const rowElement = document.createElement("tr");
            const headerElement = document.createElement("th");
            switch (key) {
                case "publicApproval":
                    headerElement.innerText = "Public approval";
                    break;
                case "governmentApproval":
                    headerElement.innerText = "Government approval";
                    break;
                case "economy":
                    headerElement.innerText = "Economy";
                    break;
                case "health":
                    headerElement.innerText = "Health";
                    break;
            }
            rowElement.appendChild(headerElement);
            const extraDataElement = document.createElement("td");
            extraStatsElements[key] = extraDataElement;
            rowElement.appendChild(extraDataElement);
            const dataElement = document.createElement("td");
            statsElements[key] = dataElement;
            rowElement.appendChild(dataElement);
            tableElement.appendChild(rowElement);
        }
        document.body.appendChild(tableElement);
    }

    for (let [key, _] of [...Object.entries(stats)]) {

        const delta = statChanges[key];
        if (delta) {
            extraStatsElements[key].innerText = `${(delta <= 0 ? "" : "+")}${delta}%`;
            extraStatsElements[key].style.color = delta <= 0 ? "orange" : "green";
            stats[key] += delta;
            if (stats[key] < 0) {
                stats[key] = 0;
            } else if (stats[key] > 100){
                stats[key] = 100;
            }
        }
        else {
            extraStatsElements[key].innerText = "";
        }
        
        statsElements[key].innerText = `${stats[key]}%`;
    }
}