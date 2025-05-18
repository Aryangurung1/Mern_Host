import { exec } from 'child_process';

const PORT = process.env.PORT || 5008;

// For Windows
const findProcessOnPort = `netstat -ano | findstr :${PORT}`;

exec(findProcessOnPort, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error finding process: ${error}`);
    return;
  }

  // Parse the output to get PID
  const lines = stdout.split('\n');
  const processLines = lines.filter(line => line.includes('LISTENING'));
  
  if (processLines.length > 0) {
    const pid = processLines[0].match(/\s+(\d+)\s*$/)[1];
    
    // Kill the process
    exec(`taskkill /F /PID ${pid}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error killing process: ${error}`);
        return;
      }
      console.log(`Successfully killed process using port ${PORT}`);
    });
  } else {
    console.log(`No process found using port ${PORT}`);
  }
}); 