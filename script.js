// --- Global Simulation State ---
        let currentAutomationSpeed = 3000; // Default: Normal (3 seconds)
        let isSidebarExpanded = true; 

        // GENERIC PROCESS STEPS
        const cncProcess = [
            { name: "Setup and Initialization", humanApproval: false, dataGeneration: true },
            { name: "Core Processing Start", humanApproval: false, dataGeneration: false },
            { name: "Mid-Process Quality Check", humanApproval: true, dataGeneration: true },
            { name: "Final Processing Phase", humanApproval: false, dataGeneration: false },
            { name: "Final Data Validation", humanApproval: false, dataGeneration: true },
            { name: "Offloading Material", humanApproval: false, dataGeneration: false },
        ];
        
        const cncProcess2 = [
            { name: "Material Receiving Check", humanApproval: false, dataGeneration: true },
            { name: "Final Quality Inspection", humanApproval: true, dataGeneration: true },
            { name: "Packaging and Shipment Prep", humanApproval: false, dataGeneration: false },
            { name: "Job Completion and Logging", humanApproval: false, dataGeneration: false },
        ];
        
        // GENERIC DATA STRUCTURES
        let machineData = {
            'Machine 1': {
                status: 'Ready',
                color: 'yellow',
                agent: 'Agent A', 
                currentStepIndex: -1, 
                processes: [],
                isAutomationRunning: false,
                automationIntervalId: null,
                liveData: { DataKey_A: 'N/A', DataKey_B: 'N/A', __INJECT_ERROR: false } 
            },
            'Machine 2': {
                status: 'Idle',
                color: 'yellow',
                agent: 'Agent B', 
                currentStepIndex: -1, 
                processes: [],
                isAutomationRunning: false,
                automationIntervalId: null,
                liveData: { Handoff_Status: 'Awaiting Input', Final_QC: 'N/A', __INJECT_ERROR: false } 
            }
        };

        // Static data for the Right Sidebar (Jobs and Issues)
        let jobData = [
            { id: 101, machine: 'Machine 1', description: 'Agent initialized and awaiting command.', time: 'Just now', color: 'text-violet-600' },
        ];

        let issueData = []; 
        
        // Approval tasks are now ONLY stored here for reference, not rendered by a dedicated function
        let approvalData = [
            { id: 301, machine: 'Machine 1', description: 'Approve initial configuration before job start.', time: 'Just now', color: 'text-violet-600', active: true }
        ];

        // --- Custom Alert/Notification Function (REMOVED: Replaced by console.log and chat logs) ---
        function consoleLog(message, type = 'info') {
            console.log(`[FACTORY ${type.toUpperCase()}] ${message}`);
        }
        
        // --- Chatbot Functionality ---

        function logChatEvent(sender, message, type = 'message', data = {}) {
            const chatHistory = document.getElementById('chat-history');
            const isSystem = sender === 'System' || sender === 'Agent A' || sender === 'Agent B';
            const icon = isSystem ? (sender === 'System' ? 'bot' : 'cpu') : 'user';
            const color = isSystem ? 'bg-gray-700' : 'bg-violet-600 ml-auto';
            const textColor = isSystem ? 'text-white' : 'text-white';
            const iconColor = isSystem ? 'text-violet-400' : 'text-white';
            const bubbleStyle = isSystem ? 'rounded-tl-none' : 'rounded-tr-none';

            let contentHTML = `<p class="${textColor}">${message}</p>`;

            if (type === 'approval') {
                const machineId = data.machine;
                contentHTML += `
                    <div class="mt-3 flex space-x-2">
                        <button onclick="handleApprovalAction(${data.id}, '${machineId}', true)" class="px-3 py-1 text-xs font-medium rounded-lg bg-green-500 text-white hover:bg-green-600 transition">Agree</button>
                        <button onclick="handleApprovalAction(${data.id}, '${machineId}', false)" class="px-3 py-1 text-xs font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition">Reject</button>
                    </div>
                `;
            }

            const messageHTML = `
                <div id="chat-msg-${data.id || Date.now()}" class="flex ${isSystem ? 'space-x-3' : 'justify-end'} text-sm">
                    ${isSystem ? `<i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0 ${iconColor}"></i>` : ''}
                    <div class="flex flex-col">
                        ${isSystem ? `<span class="text-xs text-violet-300 font-semibold mb-1">${sender}:</span>` : ''}
                        <div class="${color} p-3 rounded-xl ${bubbleStyle} max-w-xs break-words shadow-md">
                            ${contentHTML}
                        </div>
                    </div>
                    ${!isSystem ? `<i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0 ${iconColor}"></i>` : ''}
                </div>
            `;
            
            // Append message and scroll to bottom (using flex-direction: column-reverse, so prepend)
            const newMessage = document.createElement('div');
            newMessage.innerHTML = messageHTML;
            chatHistory.prepend(newMessage.firstElementChild);
            lucide.createIcons();
            
            // Note: Since we use flex-direction: column-reverse, appending to the DOM naturally scrolls it to the bottom.
        }

        function sendCommand() {
            const input = document.getElementById('chat-input');
            const command = input.value.trim();
            if (!command) return;

            logChatEvent('User', command, 'message');
            input.value = '';

            // Simple command processing (For presentation only)
            if (command.toLowerCase().includes('status')) {
                logChatEvent('System', 'Machine 1 Status: ' + machineData['Machine 1'].status + '. Machine 2 Status: ' + machineData['Machine 2'].status + '.', 'message');
            } else if (command.toLowerCase().includes('help')) {
                logChatEvent('System', 'Available commands: STATUS, RESTART M1/M2, SPEED (Fast/Normal/Slow).', 'message');
            } else if (command.toLowerCase().includes('restart m1')) {
                toggleAutomation(false); 
                logChatEvent('System', 'Attempting soft restart of Machine 1.', 'message');
            } else {
                logChatEvent('System', `Command received: "${command}". Executing... (In a real app, I'd run this command!)`, 'message');
            }
        }
        
        function handleApprovalAction(id, machineId, approved) {
            const msgElement = document.getElementById(`chat-msg-${id}`);
            
            // Find the task in the global list
            const taskIndex = approvalData.findIndex(task => task.id === id && task.active);
            if (taskIndex === -1) return; // Already acted upon

            // Mark as inactive
            approvalData[taskIndex].active = false;
            
            // 1. Remove buttons from chat message
            if (msgElement) {
                const buttons = msgElement.querySelector('.mt-3');
                if (buttons) buttons.remove();
            }

            if (approved) {
                // Process Approval
                logChatEvent('User', `Acknowledged approval for task ID ${id}.`, 'message');
                logChatEvent('System', `${machineId}: Task approved. Resuming process...`, 'message');
                approveTaskLogic(id); 
            } else {
                // Process Rejection
                logChatEvent('User', `Rejected approval for task ID ${id}.`, 'message');
                logChatEvent('System', `${machineId}: Task rejected. Automation halted for full manual review.`, 'message');
                // Halt the specific machine
                if (machineId === 'Machine 1') toggleAutomation(false);
                if (machineId === 'Machine 2') toggleAutomation2(false);
            }

            updateDashboardUI();
        }

        // --- Utility Functions ---

        function getStatusClasses(status) {
            switch (status) {
                case 'Running': return 'bg-green-100 text-green-800';
                case 'Completed': return 'bg-gray-200 text-gray-700';
                case 'Paused (Approval)': return 'bg-orange-100 text-orange-800';
                case 'Paused': return 'bg-red-100 text-red-800';
                case 'Ready for Job': return 'bg-green-100 text-green-700';
                default: return 'bg-blue-100 text-blue-800';
            }
        }
        
        // Function to log actions to the Jobs sidebar
        function logJob(machine, description, color = 'text-gray-600') {
            jobData.unshift({ 
                id: Date.now(), 
                machine: machine, 
                description: description, 
                time: 'Just now', 
                color: color 
            });
            // Keep only the latest 10 logs
            jobData = jobData.slice(0, 10); 
            
            // Also log to the chat window
            logChatEvent('System', `[Job Log] ${machine}: ${description}`, 'message');
            renderSidebarData('jobs-content', jobData, 'activity');
        }

        // --- Core Modal Functions (Standard) ---
        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            const content = document.getElementById(modalId + '-content');
            
            modal.classList.remove('hidden');
            void content.offsetWidth; 
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
            lucide.createIcons();
        }

        function closeModal(event, modalId) {
            if (event && event.target.id !== modalId) return;

            const modal = document.getElementById(modalId);
            const content = document.getElementById(modalId + '-content');

            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');

            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }

        function openMachineModal(machineId) {
            const data = machineData[machineId];
            document.getElementById('modal-title').textContent = `${machineId} Details (Agent: ${data.agent})`;
            
            // 1. Update Data Section
            document.getElementById('machine-data-display').textContent = JSON.stringify(data.liveData, null, 2);

            // 2. Update Processes Section
            const processContainer = document.getElementById('machine-processes-display');
            
            // Use the correct process array and data for the modal display
            const processArray = machineId === 'Machine 1' ? cncProcess : cncProcess2;
            const stepIndex = data.currentStepIndex;

            const processesToShow = processArray.map((p, i) => ({
                name: `Step ${i + 1}: ${p.name}`,
                status: i < stepIndex ? 'Completed' : (i === stepIndex ? data.status : 'Pending'),
                progress: i < stepIndex ? '100%' : (i === stepIndex ? '50%' : '0%') 
            }));


            processContainer.innerHTML = processesToShow.map(p => `
                <div class="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div class="flex justify-between items-center text-sm font-medium">
                        <span>${p.name}</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClasses(p.status)}">${p.status}</span>
                    </div>
                    ${p.progress ? `
                        <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
                            <div class="bg-violet-600 h-1 rounded-full" style="width: ${p.progress}"></div>
                        </div>` : ''}
                </div>
            `).join('');

            openModal('machine-modal');
        }

        function openStepsModal() {
            openModal('steps-modal');
        }

        function openSettingsModal() {
            openModal('settings-modal');
        }


        // --- Sidebar Functions (Right Sidebar Only) ---

        function switchTab(tabName) {
            const tabs = ['jobs', 'issues'];
            tabs.forEach(tab => {
                const btn = document.getElementById(`tab-${tab}`);
                const content = document.getElementById(`${tab}-content`);
                
                if (tab === tabName) {
                    btn.classList.add('active');
                    content.classList.remove('hidden');
                } else {
                    btn.classList.remove('active');
                    content.classList.add('hidden');
                }
            });
        }
        
        function renderSidebarData(containerId, data, icon) {
            const container = document.getElementById(containerId);
            
            if (containerId === 'issues-content') {
                 container.innerHTML = data.map(item => `
                    <div class="flex space-x-3 p-3 bg-red-100 rounded-lg border border-red-400">
                        <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0 mt-0.5 ${item.color}"></i>
                        <div>
                            <p class="text-sm font-medium text-gray-900">${item.description}</p>
                            <p class="text-xs text-gray-500 mt-0.5">
                                <span class="font-semibold">${item.machine}</span> - ${item.time}
                                <span class="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500 text-white">${item.severity}</span>
                            </p>
                        </div>
                    </div>
                `).join('');
            } else { // Jobs content
                container.innerHTML = data.map(item => `
                    <div class="flex space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0 mt-0.5 ${item.color}"></i>
                        <div>
                            <p class="text-sm font-medium text-gray-900">${item.description}</p>
                            <p class="text-xs text-gray-500 mt-0.5">
                                <span class="font-semibold">${item.machine}</span> - ${item.time}
                            </p>
                        </div>
                    </div>
                `).join('');
            }
            lucide.createIcons();
        }

        // --- Core Logic: Approval ---
        function approveTaskLogic(id) {
            const index = approvalData.findIndex(task => task.id === id);
            if (index > -1) {
                const approvedTask = approvalData.splice(index, 1)[0];
                logJob(approvedTask.machine, `Human approved task: ${approvedTask.description}.`, 'text-green-600');
                
                const machineId = approvedTask.machine;
                const data = machineData[machineId];
                const nextStepHandler = machineId === 'Machine 1' ? handleNextStep : handleNextStep2;
                const autoModeStatusElementId = machineId === 'Machine 1' ? 'auto-mode-status' : 'm2-auto-mode-status';
                const nextStepButtonId = machineId === 'Machine 1' ? 'next-step-btn' : 'm2-next-step-btn';

                if (data.status === 'Paused (Approval)') {
                    consoleLog(`Task approved for ${machineId}. Process resumed and advancing.`);
                    
                    // 1. Clear pause status
                    data.status = 'Running';
                    data.color = 'green';
                    updateDashboardUI();
                    
                    // 2. Advance to the next step immediately (the step that was blocked)
                    nextStepHandler(true); 

                    // 3. Check if automation loop needs to be restarted now
                    const autoModeIsOn = document.getElementById(autoModeStatusElementId).textContent.includes('ON');
                    
                    if (data.isAutomationRunning && autoModeIsOn) {
                         // Restart the interval loop
                         clearInterval(data.automationIntervalId); 
                         data.automationIntervalId = setInterval(() => nextStepHandler(false), currentAutomationSpeed);
                         // Keep manual next step button disabled
                    } else {
                         // Manual mode: keep the manual next step button enabled
                         document.getElementById(nextStepButtonId).disabled = false;
                    }

                } else if (approvedTask.id === 301) {
                    // Initial M1 approval (ID 301) to start the whole process
                    consoleLog(`Initial configuration approved. Starting Machine 1 process.`);
                    toggleAutomation(true); 
                }
            }
        }
        
        // --- Process Control Functions (M1) ---

        function toggleAutomation(start) {
            const data = machineData['Machine 1'];
            data.isAutomationRunning = start;

            const startBtn = document.getElementById('start-btn');
            const stopBtn = document.getElementById('stop-btn');
            const nextBtn = document.getElementById('next-step-btn');
            const autoToggle = document.getElementById('auto-manual-toggle');
            
            if (start) {
                if (data.currentStepIndex < 0) {
                     data.currentStepIndex = -1;
                     logJob('Machine 1', 'CNC Job STARTED. Waiting for first step...', 'text-green-600');
                } else {
                     logJob('Machine 1', 'Process Resumed.', 'text-green-600');
                }
                
                startBtn.disabled = true;
                startBtn.classList.add('opacity-50', 'cursor-not-allowed');
                stopBtn.disabled = false;
                stopBtn.classList.remove('opacity-50', 'cursor-not-allowed');

                if (autoToggle.textContent.includes('ON') && data.status !== 'Paused (Approval)') {
                    clearInterval(data.automationIntervalId);
                    data.automationIntervalId = setInterval(() => handleNextStep(false), currentAutomationSpeed);
                    nextBtn.disabled = true;
                } else if (data.status !== 'Paused (Approval)') {
                    nextBtn.disabled = false;
                }

                if (data.status !== 'Paused (Approval)') {
                    data.status = 'Running';
                    data.color = 'green';
                }
                
            } else {
                clearInterval(data.automationIntervalId);
                startBtn.disabled = false;
                startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                stopBtn.disabled = true;
                stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
                nextBtn.disabled = true; 
                
                logJob('Machine 1', 'Process STOPPED by User.', 'text-red-600');
                data.status = 'Paused';
                data.color = 'red';
            }
            updateDashboardUI();
        }

        function toggleAutoMode() {
            const data = machineData['Machine 1'];
            const statusSpan = document.getElementById('auto-mode-status');
            
            if (statusSpan.textContent.includes('OFF')) {
                statusSpan.textContent = 'ON';
                statusSpan.parentElement.classList.replace('bg-violet-100', 'bg-green-100');
                statusSpan.parentElement.classList.replace('text-violet-700', 'text-green-700');
                logJob('System', 'Machine 1 Automation ON. Steps will advance automatically.', 'text-blue-600');
                if (data.isAutomationRunning && data.status !== 'Paused (Approval)') {
                    toggleAutomation(true); 
                } else if (data.isAutomationRunning) {
                     document.getElementById('next-step-btn').disabled = true;
                }
            } else {
                statusSpan.textContent = 'OFF';
                statusSpan.parentElement.classList.replace('bg-green-100', 'bg-violet-100');
                statusSpan.parentElement.classList.replace('text-green-700', 'text-violet-700');
                logJob('System', 'Machine 1 Automation OFF. Manual step required.', 'text-blue-600');
                clearInterval(data.automationIntervalId);
                if (data.isAutomationRunning && data.status !== 'Paused (Approval)') {
                    document.getElementById('next-step-btn').disabled = false;
                }
            }
        }
        
        function handleNextStep(isManual) {
            const data = machineData['Machine 1'];
            const process = cncProcess;

            if (!data.isAutomationRunning && isManual) {
                consoleLog("Cannot advance step while Machine 1 process is stopped. Press 'Start Process' first.");
                return;
            }

            // 1. Check if the CURRENT step is an approval gate that is blocking advance
            if (data.status === 'Paused (Approval)' && isManual) {
                consoleLog("Cannot manually advance while awaiting Human Approval. Please use the 'Agree' button in the chat.");
                return;
            }

            // 2. Advance the index
            data.currentStepIndex++;
            let index = data.currentStepIndex;
            
            // 3. Check for process completion (Handoff to M2)
            if (index >= process.length) {
                logJob('Machine 1', 'JOB FINISHED. Starting Handoff to Machine 2...', 'text-green-800');
                
                // Handoff logic (enables M2)
                machineData['Machine 2'].status = 'Ready for Job';
                machineData['Machine 2'].color = 'green';
                machineData['Machine 2'].liveData.Handoff_Status = 'Material Received';
                document.getElementById('m2-start-btn').disabled = false;
                
                // Reset M1
                toggleAutomation(false); 
                data.currentStepIndex = -1;
                data.status = 'Ready (Handoff Complete)';
                data.color = 'yellow';
                
                updateDashboardUI();
                logChatEvent('System', 'MACHINE 1 JOB COMPLETE. Material passed to Machine 2. M2 Start button enabled.', 'message');
                return;
            }

            const currentStep = process[index]; 
            logJob('Machine 1', `Processing Step ${index + 1}: ${currentStep.name}...`, 'text-blue-600');

            // 4. Simulate AI Processing & Data Update (Generic)
            if (currentStep.dataGeneration) {
                const isBadData = data.liveData.__INJECT_ERROR;
                
                data.liveData.DataKey_A = isBadData ? 'ERR: Outside Tolerance' : 'OK: Within Tolerance';
                data.liveData.DataKey_B = Math.random() < 0.2 ? 'Alert: High Temp' : 'Normal';
                
                if (isBadData) {
                     issueData.unshift({ id: Date.now(), machine: 'Machine 1', description: `Critical data error detected during Step ${index + 1}.`, time: 'Just now', severity: 'CRITICAL', color: 'text-red-600' });
                     renderSidebarData('issues-content', issueData, 'alert-triangle');
                     switchTab('issues');
                     toggleAutomation(false);
                     logChatEvent('System', 'CRITICAL ERROR (M1): AI Agent detected bad data and stopped the machine!', 'message');
                }
                
                data.liveData.__INJECT_ERROR = false;
            }
            
            // 5. Check for Human Approval Gate on the CURRENT step
            if (currentStep.humanApproval) {
                const approvalId = Date.now() + 1;
                approvalData.unshift({ 
                    id: approvalId, 
                    machine: 'Machine 1', 
                    description: `Review required for data check at Step ${index + 1}: ${currentStep.name}.`, 
                    time: 'Just now', 
                    color: 'text-red-600',
                    active: true
                });
                
                data.status = 'Paused (Approval)';
                data.color = 'orange';
                
                document.getElementById('next-step-btn').disabled = true; 
                if (data.isAutomationRunning && document.getElementById('auto-mode-status').textContent.includes('ON')) {
                     clearInterval(data.automationIntervalId); 
                     logJob('System', 'M1 Automation paused for human review.', 'text-orange-500');
                }
                
                // Log approval to the new CHAT interface
                logChatEvent('System', `HUMAN APPROVAL REQUIRED: Review data check at Step ${index + 1}: ${currentStep.name}.`, 'approval', { id: approvalId, machine: 'Machine 1' });
            } else {
                if (data.isAutomationRunning && !document.getElementById('auto-mode-status').textContent.includes('ON')) {
                    document.getElementById('next-step-btn').disabled = false;
                }
            }
            
            updateDashboardUI();
        }
        
        // --- Process Control Functions (M2) ---

        function toggleAutomation2(start) {
            const data = machineData['Machine 2'];
            data.isAutomationRunning = start;

            const startBtn = document.getElementById('m2-start-btn');
            const stopBtn = document.getElementById('m2-stop-btn');
            const nextBtn = document.getElementById('m2-next-step-btn');
            const autoToggle = document.getElementById('m2-auto-manual-toggle');
            
            if (start) {
                if (data.currentStepIndex < 0) {
                     data.currentStepIndex = -1;
                     logJob('Machine 2', 'QC Job STARTED. Waiting for first step...', 'text-green-600');
                } else {
                     logJob('Machine 2', 'Process Resumed.', 'text-green-600');
                }
                
                startBtn.disabled = true;
                startBtn.classList.add('opacity-50', 'cursor-not-allowed');
                stopBtn.disabled = false;
                stopBtn.classList.remove('opacity-50', 'cursor-not-allowed');

                if (autoToggle.textContent.includes('ON') && data.status !== 'Paused (Approval)') {
                    clearInterval(data.automationIntervalId);
                    data.automationIntervalId = setInterval(() => handleNextStep2(false), currentAutomationSpeed);
                    nextBtn.disabled = true;
                } else if (data.status !== 'Paused (Approval)') {
                    nextBtn.disabled = false;
                }

                if (data.status !== 'Paused (Approval)') {
                    data.status = 'Running';
                    data.color = 'green';
                }
                
            } else {
                clearInterval(data.automationIntervalId);
                startBtn.disabled = false;
                startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                stopBtn.disabled = true;
                stopBtn.classList.add('opacity-50', 'cursor-not-allowed');
                nextBtn.disabled = true; 
                
                logJob('Machine 2', 'Process STOPPED by User.', 'text-red-600');
                data.status = 'Paused';
                data.color = 'red';
            }
            updateDashboardUI();
        }

        function toggleAutoMode2() {
            const data = machineData['Machine 2'];
            const statusSpan = document.getElementById('m2-auto-mode-status');
            
            if (statusSpan.textContent.includes('OFF')) {
                statusSpan.textContent = 'ON';
                statusSpan.parentElement.classList.replace('bg-violet-100', 'bg-green-100');
                statusSpan.parentElement.classList.replace('text-violet-700', 'text-green-700');
                logJob('System', 'Machine 2 Automation ON. Steps will advance automatically.', 'text-blue-600');
                if (data.isAutomationRunning && data.status !== 'Paused (Approval)') {
                    toggleAutomation2(true); 
                } else if (data.isAutomationRunning) {
                     document.getElementById('m2-next-step-btn').disabled = true;
                }
            } else {
                statusSpan.textContent = 'OFF';
                statusSpan.parentElement.classList.replace('bg-green-100', 'bg-violet-100');
                statusSpan.parentElement.classList.replace('text-green-700', 'text-violet-700');
                logJob('System', 'Machine 2 Automation OFF. Manual step required.', 'text-blue-600');
                clearInterval(data.automationIntervalId);
                if (data.isAutomationRunning && data.status !== 'Paused (Approval)') {
                    document.getElementById('m2-next-step-btn').disabled = false;
                }
            }
        }

        function handleNextStep2(isManual) {
            const data = machineData['Machine 2'];
            const process = cncProcess2;

            if (!data.isAutomationRunning && isManual) {
                consoleLog("Cannot advance step while Machine 2 process is stopped. Press 'Start Process' first.");
                return;
            }
            if (data.status === 'Paused (Approval)' && isManual) {
                consoleLog("Cannot manually advance while awaiting Human Approval. Please use the 'Agree' button in the chat.");
                return;
            }

            data.currentStepIndex++;
            let index = data.currentStepIndex;

            if (index >= process.length) {
                logJob('Machine 2', 'JOB COMPLETE. Final product packaged.', 'text-green-800');
                
                // Final Job Completion
                toggleAutomation2(false);
                data.currentStepIndex = -1;
                data.status = 'Idle (Job Complete)';
                data.color = 'yellow';
                data.liveData.Final_QC = 'PASS';
                
                // Reset M1 status visually for next job cycle
                machineData['Machine 1'].status = 'Ready';
                machineData['Machine 1'].color = 'yellow';
                document.getElementById('start-btn').disabled = false;

                updateDashboardUI();
                logChatEvent('System', 'MACHINE 2 JOB COMPLETE. The Factory Cycle is finished!', 'message');
                return;
            }

            const currentStep = process[index]; 
            logJob('Machine 2', `Processing Step ${index + 1}: ${currentStep.name}...`, 'text-blue-600');

            // 4. Simulate AI Processing & Data Update (Generic)
            if (currentStep.dataGeneration) {
                const isBadData = data.liveData.__INJECT_ERROR;
                
                data.liveData.Final_QC = isBadData ? 'FAIL' : 'PASS';
                data.liveData.Handoff_Status = 'Material Inspected';
                
                if (isBadData) {
                     issueData.unshift({ id: Date.now(), machine: 'Machine 2', description: `Final QC failed during Step ${index + 1}.`, time: 'Just now', severity: 'CRITICAL', color: 'text-red-600' });
                     renderSidebarData('issues-content', issueData, 'alert-triangle');
                     switchTab('issues');
                     toggleAutomation2(false);
                     logChatEvent('System', 'CRITICAL ERROR (M2): Final QC FAILED. Machine stopped!', 'message');
                }
                
                data.liveData.__INJECT_ERROR = false;
            }
            
            // 5. Check for Human Approval Gate
            if (currentStep.humanApproval) {
                const approvalId = Date.now() + 1;
                approvalData.unshift({ 
                    id: approvalId, 
                    machine: 'Machine 2', 
                    description: `Final Inspection Approval required at Step ${index + 1}: ${currentStep.name}.`, 
                    time: 'Just now', 
                    color: 'text-red-600',
                    active: true
                });
                
                data.status = 'Paused (Approval)';
                data.color = 'orange';
                
                document.getElementById('m2-next-step-btn').disabled = true; 
                if (data.isAutomationRunning && document.getElementById('m2-auto-mode-status').textContent.includes('ON')) {
                     clearInterval(data.automationIntervalId); 
                     logJob('System', 'M2 Automation paused for human review.', 'text-orange-500');
                }
                
                // Log approval to the new CHAT interface
                logChatEvent('System', `HUMAN APPROVAL REQUIRED: Final Inspection Approval required at Step ${index + 1}: ${currentStep.name}.`, 'approval', { id: approvalId, machine: 'Machine 2' });
            } else {
                if (data.isAutomationRunning && !document.getElementById('m2-auto-mode-status').textContent.includes('ON')) {
                    document.getElementById('m2-next-step-btn').disabled = false;
                }
            }
            
            updateDashboardUI();
        }

        
        // --- Shared Injection Functions ---

        function injectError(machineNum) {
            const machineId = `Machine ${machineNum}`;
            machineData[machineId].liveData.__INJECT_ERROR = true;
            logJob('System', `${machineId}: Forced Data Injection: Next data check will be BAD.`, 'text-red-600');
            logChatEvent('User', `Inject bad data into ${machineId}.`, 'message');
            logChatEvent('System', `${machineId}: FORCED INJECTION: Next data validation step is set to FAIL.`, 'message');
        }

        function injectRandomness(machineNum) {
            const machineId = `Machine ${machineNum}`;
            const isError = Math.random() < 0.5; // 50% chance of error
            machineData[machineId].liveData.__INJECT_ERROR = isError;
            
            logChatEvent('User', `Inject random data quality into ${machineId}.`, 'message');
            if (isError) {
                logJob('System', `${machineId}: Random Data Injection: Next data check will be BAD.`, 'text-red-600');
                logChatEvent('System', `${machineId}: Random Injection: Next data validation step is set to FAIL.`, 'message');
            } else {
                logJob('System', `${machineId}: Random Data Injection: Next data check will be GOOD.`, 'text-green-600');
                logChatEvent('System', `${machineId}: Random Injection: Next data validation step is set to PASS.`, 'message');
            }
        }


        // --- Speed Setting Functions ---

        function getSpeedText(speed) {
            if (speed === 1000) return 'Fast';
            if (speed === 3000) return 'Normal';
            return 'Slow';
        }

        function setAutomationSpeed(speed) {
            currentAutomationSpeed = speed;
            logJob('System', `Automation speed set to ${getSpeedText(speed)} (${speed/1000}s).`, 'text-blue-600');
            
            document.querySelectorAll('.speed-option').forEach(btn => {
                btn.classList.remove('border-violet-600', 'bg-violet-50');
                if (btn.dataset.speed === getSpeedText(speed)) {
                    btn.classList.add('border-violet-600', 'bg-violet-50');
                }
            });

            // Re-initialize intervals for both machines if they are currently running in AUTO mode
            for (const machineId of ['Machine 1', 'Machine 2']) {
                const data = machineData[machineId];
                const autoModeElementId = machineId === 'Machine 1' ? 'auto-mode-status' : 'm2-auto-mode-status';
                const nextStepHandler = machineId === 'Machine 1' ? handleNextStep : handleNextStep2;

                if (data.isAutomationRunning && document.getElementById(autoModeElementId).textContent.includes('ON') && data.status !== 'Paused (Approval)') {
                    clearInterval(data.automationIntervalId);
                    data.automationIntervalId = setInterval(() => nextStepHandler(false), currentAutomationSpeed);
                }
            }
            
            document.getElementById('current-speed-text').textContent = getSpeedText(speed);
        }

        // --- Layout Control Functions ---

        function toggleSidebar() {
            const sidebar = document.getElementById('right-sidebar');
            const toggleIcon = document.getElementById('toggle-icon');
            
            isSidebarExpanded = !isSidebarExpanded;

            if (isSidebarExpanded) {
                // EXPAND: Show 'X' icon (Action: Close)
                sidebar.classList.remove('sidebar-collapsed');
                toggleIcon.setAttribute('data-lucide', 'x');
                consoleLog('Right Sidebar Expanded.');
            } else {
                // COLLAPSE: Show 'chevrons-left' icon (Action: Open)
                sidebar.classList.add('sidebar-collapsed');
                toggleIcon.setAttribute('data-lucide', 'chevrons-left');
                consoleLog('Right Sidebar Collapsed. Main content maximized.');
            }
            lucide.createIcons();
        }

        
        // --- UI Update & Initialization ---

        function updateMachineUI(machineId) {
            const data = machineData[machineId];
            const process = machineId === 'Machine 1' ? cncProcess : cncProcess2;
            const stepIndex = data.currentStepIndex;
            
            const step = stepIndex >= 0 && stepIndex < process.length ? process[stepIndex] : { name: machineId === 'Machine 1' ? "Awaiting Job Start" : "Awaiting Handoff" };
            
            // 1. Update Machine Block
            const prefix = machineId === 'Machine 1' ? 'm1' : 'm2';
            document.getElementById(`${prefix}-indicator`).className = `w-3 h-3 rounded-full bg-${data.color}-500 ${data.color === 'green' ? 'animate-pulse' : ''}`;
            document.getElementById(`${prefix}-status-text`).className = `text-${data.color}-700 font-semibold`;
            document.getElementById(`${prefix}-status-text`).textContent = data.status;
            
            // Uses the now-consistent ID `mX-current-step` for both machines.
            document.getElementById(`${prefix}-current-step`).textContent = `Step ${stepIndex + 1}: ${step.name}`;

            // 2. Update Machine Processes (Modal view processes)
            data.processes = process.map((p, i) => ({
                name: `Step ${i + 1}: ${p.name}`,
                status: i < stepIndex ? 'Completed' : (i === stepIndex ? data.status : 'Pending'),
                progress: i < stepIndex ? '100%' : (i === stepIndex ? '50%' : '0%') 
            }));
            
            // Update the main card's ring color for errors/status
            const machineBlock = document.getElementById(`${machineId.toLowerCase().replace(' ', '-')}-block`);
            machineBlock.classList.remove('active-ring', 'error-ring');
            if (data.status === 'Running' || data.status === 'Ready for Job') {
                machineBlock.classList.add('active-ring');
            } else if (data.status === 'Paused' || data.liveData.Final_QC === 'FAIL' || data.liveData.DataKey_A && data.liveData.DataKey_A.includes('ERR')) {
                machineBlock.classList.add('error-ring');
            }
        }
        
        function updateDashboardUI() {
            updateMachineUI('Machine 1');
            updateMachineUI('Machine 2');
            
            // Update Sidebar rendering (only Jobs/Issues remain)
            renderSidebarData('issues-content', issueData, 'alert-triangle');
            renderSidebarData('jobs-content', jobData, 'activity');
        }


        // Initialization
        window.onload = function() {
            lucide.createIcons(); 
            updateDashboardUI(); 
            setAutomationSpeed(3000); 
            
            // Initial sidebar render
            renderSidebarData('jobs-content', jobData, 'activity');
            renderSidebarData('issues-content', issueData, 'alert-triangle');

            switchTab('jobs'); 
            
            // Initial Chat Approval Load
            const initialApproval = approvalData.find(t => t.id === 301);
            if (initialApproval) {
                 logChatEvent('System', `HUMAN APPROVAL REQUIRED: ${initialApproval.description}`, 'approval', { id: initialApproval.id, machine: initialApproval.machine });
            }
        };