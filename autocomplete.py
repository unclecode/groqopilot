import json
from groq import Groq
import re
client = Groq()

prompt = """You will be acting as an AI programming assistant to help complete a code snippet. I will provide you with a piece of code that has a section marked with TOBECOMPLETED tags. Your job is to fill in this section with working code that fits the context and intent of the overall code.

Here is the {LANG} code snippet with the section to be completed:
[[<code>]]
{CODE}
[[</code>]]

I will also provide some additional context that may be helpful, such as other project files or relevant API/library documentation:
[[<context>]]
{CONTEXT}
[[</context>]]

Please carefully analyze the provided code and context. In a <scratchpad> section, think through the problem step-by-step, considering what the code is trying to accomplish and how your completion can best fit in and work correctly. 

Then, inside <completions> tags, provide a JSON object with a "completions" key containing a list of {COUNT} possible completions for the TOBECOMPLETED section. Each completion should be a string that can be inserted into that section to make the code fully functional and free of syntax errors. 

If there is a comment immediately before the TOBECOMPLETED section or on the previous line, follow its instructions precisely when generating your completions.

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

Remember, the goal is to provide completions that make the code work as intended. Carefully consider the full context, and make sure your completions are valid, working code. Let me know if you have any other questions!"""

TOBECOMPLETED = "<|tobecompleted|>"

def extract_xml_data(tags, string):
    data = {}

    for tag in tags:
        pattern = f"<{tag}>(.*?)</{tag}>"
        match = re.search(pattern, string, re.DOTALL)
        if match:
            data[tag] = match.group(1).strip()
        else:
            data[tag] = ""

    return data


def autocomplete(code, context, language, count, indentation=False):
    variable_values = {
        "LANG": language, # "Python",
        "CODE": code, # "def add(arg1, arg2):\n    TOBECOMPLETED",
        "CONTEXT": context, # "This function should add two numbers together.",
        "COUNT": count, # "2"
    }

    prompt_with_variables = prompt
    for variable in variable_values:
        prompt_with_variables = prompt_with_variables.replace(
            "{" + variable + "}", variable_values[variable]
        )
    
    response = client.chat.completions.create(
            model="llama3-70b-8192",
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt_with_variables},
            ],
            temperature=0.2,
        )

    completions = extract_xml_data(["completions"], response.choices[0].message.content)['completions']
    completions = json.loads(completions)


    def beautify(code, language):
        response_beautify = client.chat.completions.create(
                model="llama3-8b-8192",
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": f"Beautify the following code in {language}:\n\n<code>\n" + code + "\n</code>\n\nWrapped the result formated code within <code> tags. Please make sure the code is formatted nicely and easy to read. Do NOT EXPLAIN the code. DO NOT add pre or post comments. ONLY format the code. ONLY return the formated code."}
                ],
                temperature=0.01,
            )
        beautify_result = extract_xml_data(["code"], response_beautify.choices[0].message.content)['code']
        return beautify_result

    from concurrent.futures import ThreadPoolExecutor

    completions_formatted = []
    with ThreadPoolExecutor() as executor:
        futures = [executor.submit(beautify, completions[i], variable_values['LANG']) for i in range(len(completions))]
        completions_formatted = [future.result() for future in futures]

    if indentation:
        indentation = 0
        for i in range(variable_values["CODE"].index(TOBECOMPLETED) - 1, 0, -1):
            if variable_values["CODE"][i] == " ":
                indentation += 1
            else:
                break

        for i in range(1, len(completions_formatted)):
            completions_formatted[i] = completions_formatted[i].replace("\n", "\n" + " " * indentation)

    return  { "completions": completions_formatted }



    # variable_values["CODE"] = variable_values["CODE"].replace(TOBECOMPLETED, completions_formatted[0])
