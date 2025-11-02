yo guys ill create the backend using python flask

response

<h1>this is for setting the users goals</h1>

```bash
based on what the user inputs (biometric information, goal to reach)
{
    "status": "OK",
    "response": "includes information to display directly. the ai response. eg this goal is unrealistic because xyz perhaps you should do something else. then the response will have the suggested goals. so you always just need to display those information",
    "macro_goals": { // goals every day
        "carbs": 300, // grams
        "protein": 127, // grams
        "fat": 70 // grams
    },
    "weekly_progress": 0.5 // eg how much to lose/gain each week
}
```

<h1>this is for keeping up with the users goals</h1> // this gets adjusted based on the users information
```bash
computer vision (differentiating food types)
{
    "status": "OK",
    "food": "hainanese chicken rice",
    "nutritional_information": {
        "serving-size": 300, // this is in grams
        "energy" 620, // this is in kcal
        "fat": {
            "base": 22.74, // grams
            "saturated": 6.108,
            "polyunsaturated": 5.52,
            "monounsaturated": 9.257,
        },
        cholesterol: 79, // in mg
        sodium: 1011, // in mg
        carbohydrates: {
            "base": 71.52, // grams
            "fibre": 1.3,
            "sugar": 2.32
        },
        protein: 29.81, // grams
        potassium: 399 // in mg
    }
}
```


```bash
webscraping // based on user searching manually for food
{
    "status": "OK",
    [
        {
            "name": "hainanese chicken rice",
            "nutritional_information": {
                "serving-size": 300, // this is in grams
                "energy" 620, // this is in kcal
                "fat": {
                    "base": 22.74, // grams
                    "saturated": 6.108,
                    "polyunsaturated": 5.52,
                    "monounsaturated": 9.257,
                },
                cholesterol: 79, // in mg
                sodium: 1011, // in mg
                carbohydrates: {
                    "base": 71.52, // grams
                    "fibre": 1.3,
                    "sugar": 2.32
                },
                protein: 29.81, // grams
                potassium: 399 // in mg
            }
        },
        ...
    ]
}
```

// worry about this afterwards. i handle the models first
model focused on estimation (detect activity level based on heart rate) (real time, based on user activity, maybe tracks exercise) (maybe just need calculate)
calorie consumption tracker model P(i think model might be needed)