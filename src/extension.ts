import * as vscode from 'vscode';
import { Ollama } from 'ollama';


const ollama = new Ollama();

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "deepseek-ext" is now active!');

	const disposable = vscode.commands.registerCommand('deepseek-ext.hiTesting', () => {
		
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
			'DeepSeek Chat',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if(message.command === 'chat') {
				const userMessage = message.text;
				let responseText = '';
				
				try{
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:1.5b',
						messages: [{role:'user', content:userMessage}],
						stream: true
					});

					for await (const part of streamResponse){
						responseText += part.message.content;
						panel.webview.postMessage({command: 'chatResponse', text: responseText});
					}
				}catch(err){
					console.error(err);
					responseText = 'Sorry, I am not able to process your request at the moment.';
					panel.webview.postMessage({command: 'chatResponse', text: responseText});
				}
			} 
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
    return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Prompt and Response</title>
				<style>
					body {
						display: flex;
						justify-content: center;
						align-items: center;
						height: 100vh;
						margin: 0;
						font-family: Arial, sans-serif;
						background-color: #f4f4f4;
					}
					#container {
						text-align: center;
						background-color: #fff;
						padding: 20px;
						border-radius: 8px;
						box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
					}
					#prompt {
						width: 300px;
						height: 100px;
						padding: 10px;
						font-size: 16px;
						border: 1px solid #ccc;
						border-radius: 4px;
						margin-bottom: 10px;
					}
					button {
						padding: 10px 20px;
						font-size: 16px;
						color: #fff;
						background-color: #007bff;
						border: none;
						border-radius: 4px;
						cursor: pointer;
					}
					button:hover {
						background-color: #0056b3;
					}
					#response {
						margin-top: 20px;
						padding: 10px;
						background-color: #e9ecef;
						border: 1px solid #ccc;
						border-radius: 4px;
						width: 300px;
						min-height: 50px;
						word-wrap: break-word;
					}
				</style>
        	</head>
        <body>
            <div id="container">
                <textarea id="prompt" placeholder="Type your message here"></textarea><br />
                <br>
                <button id="ask">Send</button>
                <div id="response"></div>
            </div>
        
            <script>

                const vscode = acquireVsCodeApi();

                document.getElementById('ask').addEventListener('click', () => {
                    const text = document.getElementById('prompt').value;
                    vscode.postMessage({ command: 'chat', text });
                });

                window.addEventListener('message', event => {
					console.log('message received in webview');
                    const { command, text } = event.data;
                    if (command === 'chatResponse') {
                        document.getElementById('response').innerText = text;
                    }
                });

            </script>
        </body>
        </html>
    `;
}

export function deactivate() {}
