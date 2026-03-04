// Get IDs of required elements in the HTML file.
const questionLabel = document.querySelector("#question");
const answersBlock = document.querySelector("#answers");
const topLabel = document.querySelector("#top");
const bottomLabel = document.querySelector("#bottom");
const submitButton = document.querySelector("#submit");

let questions = [];          // List of questions.
let currentQuestion = 0;     // Index of current question.
let answers = [];            // List of answers.
let correctAnswers = [];     // List of correct answer indices (adapted to array for logic compatibility).
let selectedAnswers = [];    // List of selected answer DOM elements.
let score = 0;               // Number of correctly answered questions.
let passingPercentage = 60;  // Passing score percentage.
let enableUserInput = true;  // Boolean that enables/disables user input.

// Fetch questions from "questions.json".
fetch("./questions.json")
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        // Store questions array from the JSON.
        questions = data.questions;
        console.log("Questions loaded:", questions);
    })
    .catch(error => console.error("Unable to fetch data:", error));

// Update a label's text and/or style.
function updateLabel(label, text = undefined, styles = undefined) {
    if (text) {
        label.innerText = text;
    }

    if (styles && styles.length % 2 === 0) {
        for (let i = 0; i < styles.length; i += 2) {
            const property = styles[i];      
            const value = styles[i + 1];     
            label.style[property] = value;   
        }
    }
}

// Update the submit button's text and function when clicked.
function updateSubmitButton(text, func) {
    submitButton.innerText = text;        
    submitButton.onclick = () => func();  
}

// Restart the quiz.
function restart() {
    score = 0;               
    currentQuestion = 0;   
    correctAnswers = [];   
    selectedAnswers = [];  

    // Change label styles.
    updateLabel(topLabel, undefined, ["display", "inline"]);
    updateLabel(questionLabel, undefined, ["display", "block"]);
    updateLabel(answersBlock, undefined, ["display", "flex"]);
    updateLabel(bottomLabel, undefined, ["display", "block"]);
    
    displayQuestion(currentQuestion);  
}

// The code that runs at the start of the program.
function start() {
    enableUserInput = true;  

    // Change label styles.
    updateLabel(topLabel, undefined, ["display", "none"]);
    updateLabel(questionLabel, "Welcome to the Programming Quiz!", ["display", "block"]);
    updateLabel(answersBlock, undefined, ["display", "none"]);
    updateLabel(bottomLabel, `You must get ${passingPercentage.toFixed(2)}% or higher to pass.`, ["display", "block"]);
    updateSubmitButton("Start", restart);
}

// The code that runs when the quiz is finished.
function end() {
    enableUserInput = true;  

    // Change label styles.
    updateLabel(topLabel, undefined, ["display", "none"]);
    updateLabel(questionLabel, "You finished the quiz!", ["display", "block"]);
    updateLabel(answersBlock, undefined, ["display", "none"]);
    updateSubmitButton("Go Back", start);

    calculateScore();  
}

// Display a question using its index.
function displayQuestion(question) {
    enableUserInput = true;  

    // Display the current question number and the user's score.
    updateLabel(topLabel, `${question + 1} of ${questions.length} (${score}/${questions.length} correct)`);
    
    // Display the current question text.
    updateLabel(questionLabel, questions[question].question);

    // Change the bottom label's style.
    updateLabel(bottomLabel, undefined, ["color", "black", "fontWeight", "normal"]);

    displayAnswers(question);  

    // Tell the user how many answers are correct.
    if (correctAnswers.length === 1) {
        updateLabel(bottomLabel, "(There is 1 correct answer.)");
    } else {
        updateLabel(bottomLabel, `(There are ${correctAnswers.length} correct answers.)`);
    }

    updateSubmitButton("Submit", submitAnswers);
}

// Display the question's answer choices.
function displayAnswers(question) {
    answers = questions[question].answers; 
    
    // Map the single correct_index from the JSON into an array so your original selection logic still works.
    correctAnswers = [questions[question].correct_index]; 
    selectedAnswers = []; 

    // Remove the answer choices from the previous question.
    while (answersBlock.hasChildNodes()) {
        answersBlock.removeChild(answersBlock.firstChild);
    }

    // Display each answer.
    for (let i = 0; i < answers.length; i++) {
        // Create an answer button.
        const answerButton = document.createElement("button");
        answerButton.innerText = answers[i];
        answerButton.id = `answer-${i + 1}`;
        answerButton.classList.add("answer");
        answerButton.onclick = function() { selectAnswer(this.id) };

        // Determine if the answer is correct using the index (i).
        if (correctAnswers.includes(i)) {
            answerButton.classList.add("correct");
        }

        // Add the answer button to the answers block.
        answersBlock.appendChild(answerButton);
    }
}

// Toggle answer button selection.
function selectAnswer(answerID) {
    if (enableUserInput) {
        const selectedAnswer = document.getElementById(answerID);

        if (!selectedAnswer.classList.contains("selected")) {
            // Only select when the number of selected answers is less than the number of correct answers.
            if (selectedAnswers.length < correctAnswers.length) {
                selectedAnswer.classList.add("selected");
                selectedAnswers.push(selectedAnswer);
                updateLabel(bottomLabel, undefined, ["color", "black", "fontWeight", "normal"]);
            } else {
                // Warn the player if they try to select too many.
                updateLabel(bottomLabel, "You must unselect an answer first.", ["color", "crimson", "fontWeight", "bold"]);
            }
        } else {
            // Unselect the answer.
            selectedAnswer.classList.remove("selected");
            // Fix: splice needs parentheses to call indexOf properly.
            selectedAnswers.splice(selectedAnswers.indexOf(selectedAnswer), 1);
            updateLabel(bottomLabel, "(There is 1 correct answer.)", ["color", "black", "fontWeight", "normal"]);
        }
    }
}

// Submit the user's answer choices.
function submitAnswers() {
    if (selectedAnswers.length === correctAnswers.length) {
        enableUserInput = false;  

        updateLabel(bottomLabel, undefined, ["color", "black", "fontWeight", "normal"]);
        
        const correctAnswerIds = document.querySelectorAll(".correct");
        const wrongSelects = document.querySelectorAll(".selected:not(.correct)");

        // Show correct answers in green.
        for (let i = 0; i < correctAnswerIds.length; i++) {
            correctAnswerIds[i].style.backgroundImage = "linear-gradient(#90ee90, #32cd32)";
        }

        // Show wrong, selected answers in red.
        for (let i = 0; i < wrongSelects.length; i++) {
            wrongSelects[i].style.backgroundImage = "linear-gradient(#e83f60, #d42828)";
            wrongSelects[i].style.color = "white";
        }

        // Add 1 point if the user has no wrong answers.
        if (wrongSelects.length === 0) {
            score++;
            topLabel.innerText = `${currentQuestion + 1} of ${questions.length} (${score}/${questions.length} correct)`;
        }

        // Update the submit button so it displays the next question when clicked.
        updateSubmitButton("Next", () => {
            currentQuestion++;  

            if (currentQuestion === questions.length) {
                end();  
            } else {
                displayQuestion(currentQuestion);  
            }
        });
    } else {
        updateLabel(bottomLabel, "Please select an answer before submitting.", ["color", "crimson", "fontWeight", "bold"]);
    }
}

// Calculate and display the score.
function calculateScore() {
    const scorePercentage = (score / questions.length) * 100;

    updateLabel(bottomLabel, `You got ${score} out of ${questions.length} (${scorePercentage.toFixed(2)}%) correct.`, ["display", "block"]);

    if (scorePercentage === 100) {
        bottomLabel.innerText += " Great job! You got all of them right!";
    } else if (scorePercentage < passingPercentage) {
        bottomLabel.innerText += " You failed. Better luck next time!";
    } else {
        bottomLabel.innerText += " You passed. Good job!";
    }
}

// Pass the function reference, don't execute it immediately.
window.onload = start;
