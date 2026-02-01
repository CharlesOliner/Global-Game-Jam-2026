const taskElement = document.getElementById("task");
const newspaperElement = document.getElementById("newspaper");
const articleTextElement = document.getElementById("article-text");
const newspaperButtonElement = document.getElementById("newspaper-button");
const newspaperButtonRowElement = document.getElementById("newspaper-button-row");
const feedbackElement = document.getElementById("feedback");
const feedbackTextElement = document.getElementById("feedback-text");
const statsElement = document.getElementById("stats");
const statsElements = {
    governmentApproval: document.getElementById("government-approval"),
    publicApproval: document.getElementById("public-approval"),
    economy: document.getElementById("economy"),
    health: document.getElementById("health")
};
const statChangeElements = {
    governmentApproval: document.getElementById("government-approval-change"),
    publicApproval: document.getElementById("public-approval-change"),
    economy: document.getElementById("economy-change"),
    health: document.getElementById("health-change")
};

function clear(element){
    while (element.firstChild) {
        element.removeChild(element.lastChild);
    }
}