document.getElementById("inputForm").addEventListener("submit", function (event) {
  event.preventDefault();

  let ganttDiv = document.querySelector(".gantt");
  ganttDiv.innerHTML = "";

  const processesInput = document.getElementById("processes").value;
  const namesInput = document.getElementById("names").value;
  const arrivalTimesInput = document.getElementById("arrivalTimes").value;
  const algorithm = document.getElementById("algorithm").value;
  const quantum = parseInt(document.getElementById("quantum").value);

  const processes = processesInput.split(",").map(Number);
  const names = namesInput.split(",");
  const arrivalTimes = arrivalTimesInput.split(",").map(Number);

  if (processes.length !== names.length || processes.length !== arrivalTimes.length) {
    document.getElementById("output").textContent = "Error: Mismatch in the number of processes, names, or arrival times.";
    return;
  }

  let result;
  switch (algorithm) {
    case "fcfs":
      result = fcfs(names, processes, arrivalTimes);
      break;
    case "sjf":
      result = sjf(names, processes, arrivalTimes);
      break;
    case "rr":
      result = rr(names, processes, arrivalTimes, quantum);
      break;
    case "srt":
      result = srt(names, processes, arrivalTimes);
      break;
    case "mlfq":
      result = mlfq(names, processes, arrivalTimes);
      break;
  }

  document.getElementById("output").textContent = result;
});

function generateGantt(data) {
  let ganttDiv = document.querySelector(".gantt");

  data.forEach((process) => {
    let div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "60px";
    div.style.padding = "8px";
    div.style.backgroundColor = "#7cbbffdd";
    div.style.border = "1px solid #000";
    div.innerHTML = `
          <div style="display: flex; flex-direction: column; justify-content: space-between; height: 100%; align-items: center">
              <span>${process.name}</span>
              <div style="display: flex; justify-content: space-between; width: 100%;">
              <span>${process.start}</span>
              <span>${process.end}</span>
              </div>
          </div>
      `;
    ganttDiv.appendChild(div);
  });
}

let awtOutput = document.getElementById("awtOutput");
let attOutput = document.getElementById("attOutput");

function fcfs(names, processes, arrivalTimes) {
  awtOutput.innerHTML = "";
  attOutput.innerHTML = "";

  let result = "FCFS:\n";
  let time = 0;
  let resultArray = [];
  let waitingSum = 0;
  let turnSum = 0;
  let awt = 0;
  let att = 0;

  for (let i = 0; i < processes.length; i++) {
    if (arrivalTimes[i] > time) {
      time = arrivalTimes[i];
    }
    result += `Process ${names[i]}: Start at ${time}, Finish at ${time + processes[i]}, Waiting: ${time - arrivalTimes[i]}\n`;

    waitingSum += time - arrivalTimes[i];
    awt = waitingSum / processes.length;

    turnSum += time - arrivalTimes[i] + processes[i];
    att = turnSum / processes.length;

    resultArray.push({
      name: names[i],
      start: time,
      end: time + processes[i],
    });

    time += processes[i];
  }

  let div1 = document.createElement("div");
  div1.innerText = awt;
  awtOutput.appendChild(div1);

  let div2 = document.createElement("div");
  div2.innerText = att;
  attOutput.appendChild(div2);

  generateGantt(resultArray);
  return result;
}

function sjf(names, processes, arrivalTimes) {
  awtOutput.innerHTML = "";
  attOutput.innerHTML = "";

  let result = "SJF:\n";
  let n = processes.length;
  let completed = Array(n).fill(false);
  let time = 0;
  let resultArray = [];
  let waitingSum = 0;
  let answerSum = 0;
  let awt = 0;
  let att = 0;

  for (let i = 0; i < n; i++) {
    let minIndex = -1;
    for (let j = 0; j < n; j++) {
      if (!completed[j] && (minIndex == -1 || processes[j] < processes[minIndex]) && arrivalTimes[j] <= time) {
        minIndex = j;
      }
    }
    if (minIndex != -1) {
      result += `Process ${names[minIndex]}: Start at ${time}, Finish at ${time + processes[minIndex]}\n`;

      waitingSum += time - arrivalTimes[i];
      awt = waitingSum / processes.length;

      answerSum += time - arrivalTimes[i] + processes[minIndex];
      att = answerSum / processes.length;

      resultArray.push({
        name: names[minIndex],
        start: time,
        end: time + processes[minIndex],
      });

      time += processes[minIndex];
      completed[minIndex] = true;
    } else {
      time++;
      i--;
    }
  }

  let div1 = document.createElement("div");
  div1.innerText = awt;
  awtOutput.appendChild(div1);

  let div2 = document.createElement("div");
  div2.innerText = att;
  attOutput.appendChild(div2);

  generateGantt(resultArray);
  return result;
}

function rr(names, processes, arrivalTimes, quantum) {
  awtOutput.innerHTML = "";
  attOutput.innerHTML = "";

  let result = "Round Robin:\n";
  let time = 0;
  let queue = processes.map((burst, index) => ({ index, burst, arrival: arrivalTimes[index] }));
  let readyQueue = [];
  let resultArray = [];
  let waitingTimes = Array(names.length).fill(0);
  let turnaroundTimes = Array(names.length).fill(0);
  let lastEndTimes = Array(names.length).fill(0);

  while (queue.length > 0 || readyQueue.length > 0) {
    while (queue.length > 0 && queue[0].arrival <= time) {
      readyQueue.push(queue.shift());
    }
    if (readyQueue.length > 0) {
      let process = readyQueue.shift();

      if (process.burst <= quantum) {
        result += `Process ${names[process.index]}: Start at ${time}, Finish at ${time + process.burst}\n`;

        resultArray.push({
          name: names[process.index],
          start: time,
          end: time + process.burst,
        });

        waitingTimes[process.index] += time - Math.max(arrivalTimes[process.index], lastEndTimes[process.index]);
        time += process.burst;
        lastEndTimes[process.index] = time;
        turnaroundTimes[process.index] = time - arrivalTimes[process.index]; // زمان گردش کار
      } else {
        result += `Process ${names[process.index]}: Start at ${time}, Partial Finish at ${time + quantum}\n`;

        resultArray.push({
          name: names[process.index],
          start: time,
          end: time + quantum,
        });

        waitingTimes[process.index] += time - Math.max(arrivalTimes[process.index], lastEndTimes[process.index]);
        time += quantum;
        process.burst -= quantum;
        readyQueue.push(process);
        lastEndTimes[process.index] = time;
      }
    } else {
      time++;
    }
  }

  let totalWaitingTime = waitingTimes.reduce((acc, val) => acc + val, 0);
  let averageWaitingTime = totalWaitingTime / names.length;

  let totalTurnaroundTime = turnaroundTimes.reduce((acc, val) => acc + val, 0);
  let averageTurnaroundTime = totalTurnaroundTime / names.length;

  let div1 = document.createElement("div");
  div1.innerText = averageWaitingTime;
  awtOutput.appendChild(div1);

  let div2 = document.createElement("div");
  div2.innerText = averageTurnaroundTime;
  attOutput.appendChild(div2);

  generateGantt(resultArray);

  return result;
}

function srt(names, processes, arrivalTimes) {
  awtOutput.innerHTML = "";
  attOutput.innerHTML = "";

  let result = "SRT:\n";
  let n = processes.length;
  let remaining = [...processes];
  let completed = Array(n).fill(false);
  let time = 0;
  let resultArray = [];
  let waitingTimes = Array(n).fill(0);
  let turnaroundTimes = Array(n).fill(0);
  let lastEndTimes = Array(n).fill(0);

  while (completed.some((c) => !c)) {
    let minIndex = -1;
    for (let i = 0; i < n; i++) {
      if (!completed[i] && (minIndex == -1 || remaining[i] < remaining[minIndex]) && arrivalTimes[i] <= time) {
        minIndex = i;
      }
    }
    if (minIndex != -1) {
      result += `Process ${names[minIndex]}: Start at ${time}, Partial Finish at ${time + 1}\n`;

      resultArray.push({
        name: names[minIndex],
        start: time,
        end: time + 1,
      });

      waitingTimes[minIndex] += time - Math.max(arrivalTimes[minIndex], lastEndTimes[minIndex]);

      time++;
      remaining[minIndex]--;
      lastEndTimes[minIndex] = time;

      if (remaining[minIndex] == 0) {
        completed[minIndex] = true;
        result = result.replace(`Partial Finish at ${time}\n`, `Finish at ${time}\n`);
        turnaroundTimes[minIndex] = time - arrivalTimes[minIndex];
      }
    } else {
      time++;
    }
  }

  let totalWaitingTime = waitingTimes.reduce((acc, val) => acc + val, 0);
  let averageWaitingTime = totalWaitingTime / names.length;

  let totalTurnaroundTime = turnaroundTimes.reduce((acc, val) => acc + val, 0);
  let averageTurnaroundTime = totalTurnaroundTime / names.length;

  let div1 = document.createElement("div");
  div1.innerText = averageWaitingTime;
  awtOutput.appendChild(div1);

  let div2 = document.createElement("div");
  div2.innerText = averageTurnaroundTime;
  attOutput.appendChild(div2);

  generateGantt(resultArray);
  return result;
}

function mlfq(names, processes, arrivalTimes) {
  awtOutput.innerHTML = "";
  attOutput.innerHTML = "";

  let result = "MLFQ:\n";
  let queues = [
    { quantum: 2, processes: [] },
    { quantum: 4, processes: [] },
    { quantum: 8, processes: [] },
  ];
  let resultArray = [];
  let waitingTimes = Array(names.length).fill(0);
  let turnaroundTimes = Array(names.length).fill(0);
  let lastEndTimes = Array(names.length).fill(0);

  processes.forEach((burst, index) => queues[0].processes.push({ index, burst, arrival: arrivalTimes[index] }));

  let time = 0;
  for (let i = 0; i < queues.length; i++) {
    let queue = queues[i];
    let readyQueue = [];
    while (queue.processes.length > 0 || readyQueue.length > 0) {
      while (queue.processes.length > 0 && queue.processes[0].arrival <= time) {
        readyQueue.push(queue.processes.shift());
      }
      if (readyQueue.length > 0) {
        let process = readyQueue.shift();
        if (process.burst <= queue.quantum) {
          result += `Process ${names[process.index]}: Start at ${time}, Finish at ${time + process.burst}\n`;

          resultArray.push({
            name: names[process.index],
            start: time,
            end: time + process.burst,
          });

          waitingTimes[process.index] += time - Math.max(arrivalTimes[process.index], lastEndTimes[process.index]);
          time += process.burst;
          lastEndTimes[process.index] = time;
          turnaroundTimes[process.index] = time - arrivalTimes[process.index];
        } else {
          result += `Process ${names[process.index]}: Start at ${time}, Partial Finish at ${time + queue.quantum}\n`;

          resultArray.push({
            name: names[process.index],
            start: time,
            end: time + queue.quantum,
          });

          waitingTimes[process.index] += time - Math.max(arrivalTimes[process.index], lastEndTimes[process.index]);
          time += queue.quantum;
          process.burst -= queue.quantum;
          lastEndTimes[process.index] = time;
          if (i + 1 < queues.length) {
            queues[i + 1].processes.push(process);
          } else {
            readyQueue.push(process);
          }
        }
      } else {
        time++;
      }
    }
  }

  let totalWaitingTime = waitingTimes.reduce((acc, val) => acc + val, 0);
  let averageWaitingTime = totalWaitingTime / names.length;

  let totalTurnaroundTime = turnaroundTimes.reduce((acc, val) => acc + val, 0);
  let averageTurnaroundTime = totalTurnaroundTime / names.length;

  let div1 = document.createElement("div");
  div1.innerText = averageWaitingTime;
  awtOutput.appendChild(div1);

  let div2 = document.createElement("div");
  div2.innerText = averageTurnaroundTime;
  attOutput.appendChild(div2);

  generateGantt(resultArray);
  return result;
}
