// @ts-nocheck

import ollama from 'ollama'// @ts-nocheck

const MODEL_NAME_GENERATE = "llama3-8b-8192"; // "llama3-70b-8192"
const MODEL_NAME_BEAUTIFY = "llama3-8b-8192"; // "llama3-70b-8192"

let prompt = `You will be acting as an AI programming assistant to help complete a code snippet. I will provide you with a piece of code that has a section marked with <|tobecompleted|> tags. Your job is to fill in this section with working code that fits the context and intent of the overall code.

Here is the {LANG} code snippet with the section to be completed:
[[<code>]]
{CODE}
[[</code>]]

I will also provide some additional context that may be helpful, such as other project files or relevant API/library documentation:
[[<context>]]
{CONTEXT}
[[</context>]]

Please carefully analyze the provided code and context. In a <scratchpad> section, think through the problem step-by-step, considering what the code is trying to accomplish and how your completion can best fit in and work correctly. 

Then, inside <completions> tags, provide a JSON object with a "completions" key containing a list of {COUNT} possible completions for the <|tobecompleted|> section. Each completion should be a string that can be inserted into that section to make the code fully functional and free of syntax errors. 

If there is a comment immediately before the <|tobecompleted|> section or on the previous line, follow its instructions precisely when generating your completions.

Your completions may either be:
1) Partial - just the left part of a line of code 
2) Full - a full lines of code, or multiple lines/a block of code. In this case, also add explanatory comments to the different lines. Also make sure code is formatted nicely.

If you determine that there is not enough information or context to provide any reasonable completions, return an empty list.

After your analysis, provide your final answer in this format:
[[<results>]]
["completion1", "completion2", "completion3"]
[[</results>]]

Therefore, a sample of your output might look like this:
<scratchpad>
Here are my thoughts on how to complete the code.
</scratchpad>

<completions>
["completion1", "completion2", "completion3"]
</completions>

Remember, the goal is to provide completions that make the code work as intended. Carefully consider the full context, and make sure your completions are valid, working code. Let me know if you have any other questions!`;

prompt = `You will be acting as an AI programming assistant to help complete a code snippet. I will provide you with a piece of code that has a section marked with <|tobecompleted|> tags. Your job is to fill in this section with working code that fits the context and intent of the overall code.

Here is the {LANG} code snippet with the section to be completed:
<|code|>
{CODE}
<|/code|>

I will also provide some additional context from other files in the project that may be helpful, or relevant API/library documentation:
<|context|>
{CONTEXT}
<|/context|>

Please carefully analyze the provided code and context. Your output should contains a <completions> XML tag contains a JSON object which is a list of {COUNT} possible completions for the <|tobecompleted|> section. Each completion should be a string that can be inserted into that section to make the code fully functional and free of syntax errors. 

If there is a comment immediately before the <|tobecompleted|> section or on the previous line, follow its instructions precisely when generating your completions.

Your completions may either be:
1) Partial - just the left part of a line of code 
2) Full - a full lines of code, or multiple lines/a block of code. In this case, also add explanatory comments to the different lines. Also make sure code is formatted nicely.

If you determine that there is not enough information or context to provide any reasonable completions, return an empty list.

After your analysis, provide your final answer in this format:
<completions>
["completion1", "completion2", "completion3"]
</completions>

Therefore, a sample of your output might look like this:
<completions>
["completion1", "completion2", "completion3"]
</completions>

------------------BEGINNING OF EXAMPLES------------------
EXAMPLE 1:
<|code|>
def calculate_average(numbers):
    total = sum(numbers)
    count = len(numbers)
    average = <|tobecompleted|>
    return average
<|/code|>

<completions>
["total / count", "round(total / count, 2)", "total // count"]
</completions>

EXAMPLE 2:
<|code|>
def factorial(n):
    if n == 0:
        return 1
    else:
        <|tobecompleted|>
<|/code|>

<completions>
["return n * factorial(n - 1)", "result = 1\nfor i in range(1, n + 1):\n\tresult *= i\nreturn result", "return reduce(lambda x, y: x * y, range(1, n + 1))"]
</completions>

EXAMPLE 3:
<|code|>
def is_prime(num):
    if num < 2:
        return False
    for i in range(2, int(num ** 0.5) + 1):
        if <|tobecompleted|>
<|/code|>

<completions>
["num % i == 0:", "not num % i:", "num % i == 0:\n\t\treturn False"]
</completions>

EXAMPLE 4:
<|code|>
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                <|tobecompleted|>
<|/code|>

<completions>
["arr[j], arr[j + 1] = arr[j + 1], arr[j]", "temp = arr[j]\n\t\t\t\tarr[j] = arr[j + 1]\n\t\t\t\tarr[j + 1] = temp", "swap(arr, j, j + 1)"]
</completions>

EXAMPLE 5:
<|code|>
def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif <|tobecompleted|>
<|/code|>

<completions>
["arr[mid] < target:\n\t\t\tlow = mid + 1", "target < arr[mid]:\n\t\t\thigh = mid - 1", "arr[mid] > target:\n\t\t\thigh = mid - 1\n\t\telse:\n\t\t\tlow = mid + 1"]
</completions>

EXAMPLE 6:
<|code|>
def fizz_buzz(n):
    for i in range(1, n + 1):
        if <|tobecompleted|>
<|/code|>

<completions>
["i % 3 == 0 and i % 5 == 0:\n\t\t\tprint(\"FizzBuzz\")", "i % 3 == 0:\n\t\t\tprint(\"Fizz\")\n\t\telif i % 5 == 0:\n\t\t\tprint(\"Buzz\")\n\t\telse:\n\t\t\tprint(i)", "i % 15 == 0:\n\t\t\tprint(\"FizzBuzz\")\n\t\telif i % 3 == 0:\n\t\t\tprint(\"Fizz\")\n\t\telif i % 5 == 0:\n\t\t\tprint(\"Buzz\")\n\t\telse:\n\t\t\tprint(i)"]
</completions>

EXAMPLE 7:
<|code|>
def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    else:
        fib = [0, 1]
        for i in range(2, n):
            <|tobecompleted|>
        return fib
<|/code|>

<completions>
["fib.append(fib[i - 1] + fib[i - 2])", "next_fib = fib[i - 1] + fib[i - 2]\n\t\t\tfib.append(next_fib)", "fib += [fib[-1] + fib[-2]]"]
</completions>

EXAMPLE 8:
<|code|>
def decimal_to_binary(decimal):
    if decimal == 0:
        return "0"
    binary = ""
    while decimal > 0:
        <|tobecompleted|>
    return binary[::-1]
<|/code|>

<completions>
["binary += str(decimal % 2)\n\t\tdecimal //= 2", "remainder = decimal % 2\n\t\tbinary = str(remainder) + binary\n\t\tdecimal //= 2", "bit = decimal % 2\n\t\tbinary = str(bit) + binary\n\t\tdecimal >>= 1"]
</completions>

EXAMPLE 9:
<|code|>
def is_palindrome(s):
    s = ''.join(c.lower() for c in s if c.isalnum())
    return <|tobecompleted|>
<|/code|>

<completions>
["s == s[::-1]", "all(s[i] == s[~i] for i in range(len(s) // 2))", "s[:len(s)//2] == s[:-len(s)//2-1:-1]"]
</completions>

EXAMPLE 10:
<|code|>
def calculate_factorial(n):
    if n < 0:
        raise ValueError("Factorial is not defined for negative numbers.")
    <|tobecompleted|>
<|/code|>

<completions>
["result = 1\nfor i in range(1, n + 1):\n\tresult *= i\nreturn result", "return reduce(lambda x, y: x * y, range(1, n + 1))", "return math.factorial(n)"]
</completions>
------------------END OF EXAMPLES------------------

IMPORTANT:
- Remember, the goal is to provide completions that make the code work as intended. Carefully consider the full context, and make sure your completions are valid, working code. Let me know if you have any other questions!
- Do NOT add any explanation before or after the <completions> tag. Only provide the completions. Do NOT add any pre or post comments. Only return the completions.

Start to analyze the code and provide {COUNT} completions for the given code above.`;

const TOBECOMPLETED = "<|tobecompleted|>";

function extractXmlData(tags, string) {
    const data = {};

    for (const tag of tags) {
        const pattern = new RegExp(`<${tag}>(.*?)</${tag}>`, "s");
        const match = string.match(pattern);
        if (match) {
            data[tag] = match[1].trim();
        } else {
            data[tag] = "";
        }
    }

    return data;
}

async function beautify(code, language) {
    
    try {
        const responseBeautify = await client.chat.completions.create({
            model: MODEL_NAME_BEAUTIFY,
            max_tokens: 128,
            messages: [
                {
                    role: "user",
                    content: `Beautify the following code in ${language}:\n\n<code>\n${code}\n</code>\n\nWrapped the result formatted code within <code> tags. Please make sure the code is formatted nicely and easy to read. Do NOT EXPLAIN the code. DO NOT add pre or post comments. ONLY format the code. ONLY return the formatted code.`,
                },
            ],
            temperature: 0.01,
        });
        const beautifyResult = extractXmlData(
            ["code"],
            responseBeautify.choices[0].message.content
        )["code"];
        return beautifyResult;
    } catch (error) {
        console.log(error);
        return code;
    }
}

async function deepseekCodeCompletion(code, model, context, language, count, beautify = false, indentation = false) {
    let start_time = new Date().getTime();
    model = model || 'deepseek-coder:1.3b-base'

    const response = await ollama.chat({
        model: model,
        messages: [{ role: 'user', content: `<｜fim▁begin｜>${code}<｜fim▁end｜>` }]
    })
    let end_time = new Date().getTime();
    console.log(model + " Time taken for completion: " + (end_time - start_time) + "ms");
    
    let suggestions =  [response.message.content]

    if (suggestions.length === 0) {
        return { suggestions: [] };
    }

    if (beautify) {
        suggestions = await Promise.all(
            suggestions.map((suggestion) => beautify(suggestion, language))
        );
    }

    if (indentation) {
        let indentationCount = 0;
        for (let i = code.indexOf(TOBECOMPLETED) - 1; i >= 0; i--) {
            if (code[i] === " ") {
                indentationCount++;
            } else {
                break;
            }
        }

        for (let i = 1; i < suggestions.length; i++) {
            suggestions[i] = suggestions[i].replace(
                /\n/g,
                "\n" + " ".repeat(indentationCount)
            );
        }
    }

    return { suggestions: suggestions };

}

async function autocomplete(client, code, model, context, language, count, beautify = false, indentation = false) {
    const variableValues = {
        LANG: language,
        CODE: code.trim(),
        CONTEXT: context,
        COUNT: count,
    };

    let promptWithVariables = prompt;
    for (const variable in variableValues) {
        promptWithVariables = promptWithVariables.replaceAll(
            `{${variable}}`,
            variableValues[variable]
        );
    }

    try {
        let start_time = new Date().getTime();
        const response = await client.chat.completions.create({
            model: model || MODEL_NAME_GENERATE,
            max_tokens: 2048,
            messages: [{ role: "user", content: promptWithVariables }],
            temperature: 0.2,
        });
        let end_time = new Date().getTime();
        console.log("Time taken for completion: " + (end_time - start_time) + "ms");

        let completions = extractXmlData(
            ["completions"],
            response.choices[0].message.content
        );
        try {
            completions = JSON.parse(completions.completions.replace(/\n/g, '\\n').replace(/\r/g, '\\r'));
        }
        catch (e) {
            console.log(e)
        }

        

        let completionsFormatted = completions;
        if (beautify) {
            completionsFormatted = await Promise.all(
                completions.map((completion) => beautify(completion, variableValues.LANG))
            );
        }

        if (indentation) {
            let indentationCount = 0;
            for (let i = variableValues.CODE.indexOf(TOBECOMPLETED) - 1; i >= 0; i--) {
                if (variableValues.CODE[i] === " ") {
                    indentationCount++;
                } else {
                    break;
                }
            }

            for (let i = 1; i < completionsFormatted.length; i++) {
                completionsFormatted[i] = completionsFormatted[i].replace(
                    /\n/g,
                    "\n" + " ".repeat(indentationCount)
                );
            }
        }

        return { suggestions: completionsFormatted };
    } catch (error) {
        console.log(error);
        return { suggestions: [] };
    }
}

module.exports = {
    autocomplete,
    deepseekCodeCompletion,
    TOBECOMPLETED,
};