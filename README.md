# 1nfin1tyg API Client

A NodeJS application for automating interactions with the Infinity. This tool helps manage multiple accounts, perform daily check-ins, and complete tasks to earn points on the Infinity Ground platform.

## Features

- **Multiple Account Support**: Manage and automate multiple wallets from a single application
- **Proxy Support**: Optional proxy integration for distributed access
- **Task Automation**: Automatically complete daily tasks and check-ins
- **Configurable Settings**: Customize retry attempts, delays, and other parameters
- **Detailed Logging**: Comprehensive logging system with colored console output and file storage

## Installation

1. Clone the repository
```bash
git clone https://github.com/Usernameusernamenotavailbleisnot/1nfin1tyg.git
cd 1nfin1tyg
```

2. Install dependencies
```bash
npm install
```

3. Set up your configuration files:
   - Add your private keys to `pk.txt` (one per line)
   - If using proxies, add them to `proxy.txt` (one per line)
   - Configure settings in `config.json` (or use the default)

## Configuration

### Private Keys

Add one private key per line in the `pk.txt` file:
```
0x1
0x2
```

### Proxies (Optional)

Add one proxy per line in the `proxy.txt` file in the format:
```
http://user:pw@ip:port
http://user:pw@ip:port2
```

### Config Options

Edit the `config.json` file to customize the application behavior:

```json
{
  "enableProxy": true,      // Enable/disable proxy support
  "enableTask": true,       // Enable/disable task automation
  "enableCheckIn": true,    // Enable/disable daily check-ins
  "retryCount": 5,          // Number of retry attempts for API calls
  "retryDelay": 1000,       // Initial delay between retries (ms)
  "taskDelay": 1000,        // Delay between tasks (ms)
  "dailyDelay": 90000000    // Delay before running the cycle again (ms)
}
```

## Usage

Start the application:

```bash
npm start
```

The application will:
1. Process each account in your `pk.txt` file
2. Perform daily check-ins (if enabled)
3. Complete available tasks (if enabled)
4. Wait for the configured delay period
5. Repeat the process

## Logs

Logs are stored in the `logs` directory:
- `combined.log`: Contains all log messages
- `error.log`: Contains only error messages

Console output uses color coding for different message types:
- Blue: Information messages
- Green: Success messages
- Yellow: Warning messages
- Red: Error messages
- Gray: Debug messages (only visible when debug mode is enabled)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
