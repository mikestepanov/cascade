const { execSync } = require('node:child_process');

const ports = process.argv.slice(2);

if (ports.length === 0) {
  console.log('Usage: node kill-port.cjs <port> [port...]');
  process.exit(0);
}

console.log(`🔍 Checking ports: ${ports.join(', ')}...`);

ports.forEach(port => {
  try {
    // Find process ID using netstat
    // -a: all connections, -n: numeric, -o: show PID
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    
    // Parse output lines
    const lines = stdout.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Line format: TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       12345
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1]; // PID is the last column
      const state = parts[3]; // LISTENING, ESTABLISHED, etc. (optional check)

      if (pid && /^\d+$/.test(pid) && pid !== '0') {
         try {
            console.log(`   found process ${pid} on port ${port}. Killing...`);
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
            console.log(`   ✅ Killed process ${pid}`);
         } catch (e) {
            console.log(`   ⚠️  Failed to kill ${pid}: ${e.message}`);
         }
      }
    });

  } catch (e) {
    // netstat returns exit code 1 if nothing found, which is fine
    // console.log(`   ⚪ Port ${port} is free (or check failed)`);
  }
});

console.log('✨ Port cleanup complete.\n');
