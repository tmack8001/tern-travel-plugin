// content.js

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterDOMLoaded);
} else {
    afterDOMLoaded();
}

const observer = new MutationObserver(() => {
    // Check if your target element exists after a mutation occurs
    const mainElement = document.querySelector('[data-controller="trips--index--list--kanban"]');
    if (mainElement) {
        summarizeTripsInStatus();
        observer.disconnect(); // Stop observing once done or keep watching based on needs.
    }
});


function afterDOMLoaded() {
    summarizeTripsInStatus();

    // Select the turbo-frame containing tasks_list
    const tasksListFrame = document.getElementById('tasks_list');
    if (tasksListFrame) {
        // Extract column headers from the table header
        const columnHeadersDiv = tasksListFrame.querySelector('.table-header-group');
        const headers = Array.from(columnHeadersDiv.querySelectorAll('.table-cell'))
            .map(cell => cell.innerText.trim());
        // Prepare an array for task data
        const tasksData = [];
        // Find all rows within 'table-row-group'
        const rows = tasksListFrame.querySelectorAll('.table-row-group .table-row');
        rows.forEach(row => {
            const rowData = {};
            const cells = row.querySelectorAll('.table-cell');
            cells.forEach((cell, index) => {
                rowData[headers[index]] = cell.innerText.trim();
            });
            if (Object.keys(rowData).length > 0) {
                tasksData.push(rowData);
            }
        });

        // Initialize counters for due dates
        let countDueIn7Days = 0;
        let countDueIn7To14Days = 0;
        let countDueIn14To30Days = 0;
        let countDueBeyond14Days = 0;
        let countDueBeyond30Days = 0;

        const todayDateObj = new Date();
        function getDaysUntilDate(dueDateString) {
            const oneDay = 1000 * 60 * 60 * 24; // mills * seconds * minutes * hours
            const dueDateObj = new Date(dueDateString);
            return Math.ceil((dueDateObj - todayDateObj) / (oneDay));
        }
        tasksData.forEach(task => {
            if (task['Due Date']) {   // Assuming "Due Date" is one of your keys in JSON structure.
                const diffDays = getDaysUntilDate(task['Due Date']);
                if (diffDays <= 7 && diffDays >= 1) {
                    countDueIn7Days++;
                } else if (diffDays > 7 && diffDays <= 14) {
                    countDueIn7To14Days++;
                } else if (diffDays > 14) {
                    countDueBeyond14Days++;
                }
                // } else if (diffDays > 14 && diffDays <= 30) {
                //     countDueIn14To30Days++;
                // } else if (diffDays > 30) {
                //     countDueBeyond30Days++;
                // }
            }
        });

        console.log(`Number of Tasks Due In Next Up To & Including:`);
        console.log(`- Within Next <b>7 Days</b>: ${countDueIn7Days}`);
        console.log(`- Between <b>8 Days</b> To <b>14 Days</b>: ${countDueIn7To14Days}`);
        console.log(`- Beyond <b>14 Days</b>: ${countDueBeyond14Days}`);
        // console.log(`- Between <b>15 Days</b> To <b>30 Days</b>: ${countDueIn14To30Days}`);
        // console.log(`- Beyond <b>30 Days</b>: ${countDueBeyond30Days}`);

        createTaskSummarySection();

        updateTaskSummary(countDueIn7Days, countDueIn7To14Days, countDueIn14To30Days, countDueBeyond14Days, countDueBeyond30Days)
    }

    function createTaskSummarySection() {
        // Find the parent container using data-controller attribute
        const uiFormController = document.querySelector('[data-controller="ui--form"]');
        if (!uiFormController || !uiFormController.children[1]) return; // Ensure it has at least 2 children
        // Create summary section HTML structure
        const summarySection = document.createElement('div');
        summarySection.id = 'task-summary';
            summarySection.innerHTML=`
                <h2>Task Summary</h2>
                <div class="summary-item red">
                    <span>Due This Week (within 7 Days): </span><strong id="due-this-week-count">0</strong>
                </div>
                <div class="summary-item yellow">
                    <span>Due Next Week (7-14 Days): </span><strong id="due-next-week-count">0</strong>
                </div>
                <div class="summary-item green">
                    <span>Upcoming Tasks (15+ Days): </span><strong id="upcoming-count">0</strong>
                </div>`;
         // Add styles directly to head or via CSS file:
         const style=document.createElement('style'); 
         style.textContent=`
            #task-summary {padding:15px;background-color:#f9f9f9;border-radius:8px;box-shadow:0 2px 4px rgba(0, 0, 0, 0.1);}
            .summary-item {padding:8px;margin-bottom:5px;color:white;}
            .red {background-color:#ff4d4d;} /* Red for urgent */
            .yellow {background-color:#ffcc00;} /* Yellow for caution */
            .green {background-color:#28a745;} /* Green for safe */
            h2{font-size:18px;margin-bottom:10px;}
        `;
         document.head.appendChild(style);
         uiFormController.children[1].appendChild(summarySection); // Append as a child of the second child div
    }
    
    // Function to update task counts in the summary section.
    function updateTaskSummary(countDueIn7Days, countDueIn7To14Days, countDueIn14To30Days, countDueBeyond14Days, countDueBeyond30Days) {
        // Update DOM elements with calculated counts.
        document.getElementById('due-this-week-count').innerText = countDueIn7Days || '0';
        document.getElementById('due-next-week-count').innerText = countDueIn7To14Days || '0';
        // document.getElementById('due-week-after-next-count').innerText = countDueIn14To30Days || '0';
        document.getElementById('upcoming-count').innerText= countDueBeyond14Days ||'0';  
        // document.getElementById('upcoming-count').innerText= countDueBeyond30Days ||'0';  
    }
}

function summarizeTripsInStatus() {
    const mainElement = document.querySelector('[data-controller="trips--index--list--kanban"]');
    if (mainElement) {
        // Find all divs that match the trip status ID pattern
        const tripStatusDivs = mainElement.querySelectorAll('div[id^="trip_status_"]');
        tripStatusDivs.forEach(div => {
            // Find the first <ul> child within each trip_status div
            const ul = div.querySelector('ul');
            
            // <div class="flex-shrink-0 p-3 text-sm font-medium text-gray-900" style="
            //     display: flex;
            //     justify-content: space-between;
            // "><h3 class="flex-shrink-0 p-3 text-sm font-medium text-gray-900" style="
            //     width: 60%;
            //     display: inline-flex;
            // ">Inbound</h3>
            // <div class="flex-shrink-0 p-2 text-sm font-medium text-gray-900" style="
            //     width: 25%;
            //     display: inline-flex;
            //     justify-content: flex-end;
            // "><div class="flex-shrink-0 p-3 text-sm font-medium text-gray-900" style="
            //     width: 30px;
            //     height: 30px;
            //     border-radius: 50%;
            //     background-color: #ccc;
            //     display: flex;
            //     justify-content: center;
            //     align-items: center;
            // "><p style="" class="text-sm text-gray-900 font-medium">3</p></div></div></div>
            if (ul) {
                const liCount = Array.from(ul.children).filter(child => child.tagName === 'LI').length;
                // For demonstration purposes, log or display the count
                console.log(`Status ID: ${div.id}, Number of Trips: ${liCount}`);
                
                const existingH3 = div.querySelector('h3');
                const h3Text = existingH3.innerHTML;
                const messageDiv = document.createElement('div');
                messageDiv.innerHTML = `
                    <div class="flex-shrink-0 p-3 text-sm font-medium text-gray-900" style="
                        display: flex;
                        justify-content: space-between;
                    ">
                        <h3 class="flex-shrink-0 p-3 text-sm font-medium text-gray-900" style="
                            width: 60%;
                            display: inline-flex;
                        ">${h3Text}</h3>
                        <div class="flex-shrink-0 p-2 text-sm font-medium text-gray-900" style="
                            width: 25%;
                            display: inline-flex;
                            justify-content: flex-end;
                        ">
                            <div class="flex-shrink-0 p-3 text-sm font-medium text-gray-900" style="
                                width: 25px;
                                height: 25px;
                                border-radius: 50%;
                                background-color: #ccc;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                            ">
                                <p class="text-sm text-gray-900 font-medium">${liCount}</p>
                            </div>
                        </div>
                    </div>`;
                div.replaceChild(messageDiv, existingH3); // Replace the existing h3 element
 
                // // Count only direct <li> children of this <ul>
                // const liCount = Array.from(ul.children).filter(child => child.tagName === 'LI').length;
                // // For demonstration purposes, log or display the count
                // console.log(`Status ID: ${div.id}, Number of Trips: ${liCount}`);
                // // Optionally add an indication in your UI:
                // const messageDiv = document.createElement('div');
                // messageDiv.innerText = `Status ID: ${div.id} has ${liCount} trips.`;
                // messageDiv.style.marginTop = '10px';
                // div.appendChild(messageDiv); // Append message below each Trip Status section
            } else {
                console.log(`No <ul> found in Trip Status ID: ${div.id}`);
            }
        });
    }
}
