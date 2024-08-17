import random
import numpy as np
from deap import base, creator, tools, algorithms
import json
import os
import requests
import csv
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# Set the correct path to JSON files
script_dir = os.path.dirname(__file__)
locations_path = os.path.join(script_dir, 'locations.json')
output_path = os.path.join(script_dir, 'best_route.json')
csv_file_path = os.path.join(script_dir, 'generation_results.csv')

# Load locations from JSON file
def load_locations():
    print("Loading locations from JSON file...")
    with open(locations_path, 'r') as file:
        locations = json.load(file)
    print("Locations loaded.")
    return locations

# Flask URLs
route_calculation_url = "http://localhost:5000/calculate-route"
results_url_template = "http://localhost:5000/get-results/{}"

# Poll for results
def poll_for_results(task_id):
    print(f"Polling for results for task ID: {task_id}...")
    url = results_url_template.format(task_id)
    while True:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'complete':
                print(f"Results received for task ID: {task_id}")
                return data['total_distance'], data['segment_distances']
        print(f"Waiting for task {task_id} to complete...")
        time.sleep(1)

# Set up Selenium headless browser with WebGL disabled
def setup_headless_browser():
    print("Setting up headless browser...")
    chrome_options = Options()
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--window-size=1920x1080")
    chrome_options.add_argument("--use-gl=angle")
    browser = webdriver.Chrome(options=chrome_options)
    print("Headless browser set up complete.")
    return browser

# Fitness cache
fitness_cache = {}

# Fitness function
def fitness(individual):
    global browser_instance
    individual_key = tuple(individual)
    
    # Check if the fitness value is already in the cache
    if individual_key in fitness_cache:
        print(f"Using cached fitness for individual {individual_key}")
        return fitness_cache[individual_key]
    
    print("Starting fitness function...")
    waypoints = [locations['waypoints'][i] for i in individual]
    data = {
        "origin": locations['origin'],
        "destination": locations['destination'],
        "waypoints": waypoints
    }
    print(f"Sending request to Flask API to calculate route with data: {data}")
    response = requests.post(route_calculation_url, json=data)
    if response.status_code == 202:
        task_id = response.json().get("task_id")
        url_to_open = f"http://localhost:8000/?task_id={task_id}"
        print(f"Opening headless browser for task ID: {task_id}")
        browser_instance.get(url_to_open)
        total_distance, segment_distances = poll_for_results(task_id)
        print(f"Fitness function completed for task ID: {task_id}")
        
        # Cache the result
        fitness_cache[individual_key] = (total_distance, segment_distances)
        return total_distance, segment_distances
    else:
        print(f"Error in fitness function: {response.text}")
        return float('inf'),

# Save the best route
def save_best_route(best_route, shortest_time_formatted):
    print("Saving best route to JSON file...")
    output_data = {"best_route": best_route, "shortest_time": shortest_time_formatted}
    with open(output_path, 'w') as outfile:
        json.dump(output_data, outfile, indent=4)
    print(f"Best route saved to {output_path}")

# Convert time from seconds to minutes and seconds
def convert_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes} minutes, {seconds} seconds"

# Function to log generation results to CSV
def log_generation_results(writer, gen, best_waypoint_order, total_distance, segment_distances):
    print(f"Logging results for generation {gen + 1} to CSV...")
    total_time_seconds = total_distance / 15  # Assuming speed of travel is 15 meters per second
    total_time_formatted = convert_time(total_time_seconds)

    # Calculate the time taken to travel half the distance
    half_distance = total_distance / 2
    cumulative_distance = 0
    time_at_half_distance = 0
    for segment in segment_distances:
        cumulative_distance += segment
        if cumulative_distance >= half_distance:
            time_at_half_distance += (half_distance - (cumulative_distance - segment)) / 15
            break
        else:
            time_at_half_distance += segment / 15

    time_at_half_distance_formatted = convert_time(time_at_half_distance)

    writer.writerow({
        'generation': gen + 1,
        'route_taken': ' -> '.join(['origin'] + best_waypoint_order + ['destination']),
        'total_distance': total_distance,
        'total_time': total_time_formatted,
        'total_time_at_half_distance': time_at_half_distance_formatted
    })

    # Flush and sync to ensure data is written immediately
    csv_file.flush()
    os.fsync(csv_file.fileno())
    print(f"Results for generation {gen + 1} logged to CSV.")

# DEAP setup
creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

# Load locations before DEAP setup
locations = load_locations()

toolbox = base.Toolbox()
toolbox.register("indices", random.sample, range(len(locations['waypoints'])), len(locations['waypoints']))
toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
toolbox.register("population", tools.initRepeat, list, toolbox.individual)
toolbox.register("evaluate", fitness)
toolbox.register("mate", tools.cxOrdered)
toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.05)
toolbox.register("select", tools.selTournament, tournsize=3)

population_size = 5  # Only one individual per generation
crossover_probability = 0.8
mutation_probability = 0.2
generations = 5

def main():
    print("Starting main genetic algorithm...")
    pop = toolbox.population(n=population_size)
    hof = tools.HallOfFame(1)
    stats = tools.Statistics(lambda ind: ind.fitness.values)
    stats.register("avg", np.mean)
    stats.register("min", np.min)
    stats.register("max", np.max)

    with open(csv_file_path, mode='w', newline='') as csv_file:
        fieldnames = ['generation', 'route_taken', 'total_distance', 'total_time', 'total_time_at_half_distance']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for gen in range(generations):
            print(f"Generation {gen + 1}/{generations} started.")

            fitnesses = list(map(toolbox.evaluate, pop))
            for ind, fit in zip(pop, fitnesses):
                ind.fitness.values = fit

            best_individual = tools.selBest(pop, 1)[0]
            best_waypoint_order = [locations['waypoints'][i]['location'] for i in best_individual]
            total_distance, segment_distances = fitness(best_individual)

            # Log the generation results
            log_generation_results(writer, gen, best_waypoint_order, total_distance, segment_distances)

            # Select and evolve the next generation
            offspring = toolbox.select(pop, len(pop))
            offspring = list(map(toolbox.clone, offspring))

            for child1, child2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < crossover_probability:
                    toolbox.mate(child1, child2)
                    del child1.fitness.values
                    del child2.fitness.values

            for mutant in offspring:
                if random.random() < mutation_probability:
                    toolbox.mutate(mutant)
                    del mutant.fitness.values

            invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
            fitnesses = map(toolbox.evaluate, invalid_ind)
            for ind, fit in zip(invalid_ind, fitnesses):
                ind.fitness.values = fit

            pop[:] = offspring
            record = stats.compile(pop)
            print(f"Statistics for generation {gen + 1}: {record}")
            hof.update(pop)

        print("Main genetic algorithm completed.")

    return pop, hof


if __name__ == "__main__":
    print("Starting the script...")
    browser_instance = setup_headless_browser()
    try:
        locations = load_locations()
        pop, hof = main()
        best_individual = hof[0]
        best_waypoint_order = [locations['waypoints'][i]['location'] for i in best_individual]
        best_route = [locations['origin']['location']] + best_waypoint_order + [locations['destination']['location']]
        total_distance, segment_distances = fitness(best_individual)
        shortest_time_seconds = total_distance / 15
        shortest_time_formatted = convert_time(shortest_time_seconds)
        print("Best route:", best_route)
        print("Shortest time (seconds):", shortest_time_formatted)
        save_best_route(best_route, shortest_time_formatted)
    finally:
        browser_instance.quit()
