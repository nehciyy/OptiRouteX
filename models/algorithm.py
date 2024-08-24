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

# Set the correct path to JSON and CSV files in the data folder outside of the models folder
script_dir = os.path.dirname(__file__)
parent_dir = os.path.abspath(os.path.join(script_dir, os.pardir))
data_folder_path = os.path.join(parent_dir, 'data')

locations_path = os.path.join(script_dir, 'locations.json')
csv_file_path = os.path.join(data_folder_path, 'generation_results_gen5_test10_traffic.csv')
best_route_csv_path = os.path.join(data_folder_path, 'best_route_gen5_test10_traffic.csv')

# Load locations from JSON file
def load_locations():
    print("Loading locations from JSON file...")
    with open(locations_path, 'r') as file:
        locations = json.load(file)
    print("Locations loaded.")
    return locations

# Set up Selenium headless browser with WebGL disabled
def setup_headless_browser():
    print("Setting up headless browser...")
    chrome_options = Options()
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--window-size=1920x1080")
    browser = webdriver.Chrome(options=chrome_options)
    print("Headless browser set up complete.")
    return browser

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
                return data['total_distance'], data['segment_distances'], data.get('red_traffic_count', 0)
        else:
            print(f"Error fetching results for task ID: {task_id}, status code: {response.status_code}")
        time.sleep(1)
        print(f"Waiting for task {task_id} to complete...")

# Convert time from seconds to minutes and seconds
def convert_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes} minutes, {seconds} seconds"

def calculate_total_time(total_distance, red_traffic_count):
     # Calculate the total time in minutes
        print(f"Red traffic count: {red_traffic_count}")

        total_time = total_distance / 15  # Base time assuming 15 units per minute
        # Adjust total time if there's any red traffic condition
        if red_traffic_count > 0:
            total_traffic_time = red_traffic_count * 1.2  # Calculate total traffic time in minutes
        else:
            total_traffic_time = 0
        
        total_time += total_traffic_time  # Add total traffic time to the total time

        total_time = convert_time(total_time)  # Convert total time from minutes to the formatted string

        return total_time

# Store generation results in a list
def store_generation_results(generation_results, gen, best_waypoint_order, total_distance, waypoints_covered_at_half_distance, red_traffic_count):
    print(f"Storing results for generation {gen + 1}...")
    total_time = calculate_total_time(total_distance, red_traffic_count)

    generation_results.append({
        'generation': gen + 1,
        'route_taken': ' -> '.join(['origin'] + best_waypoint_order + ['destination']),
        'total_distance': total_distance,
        'total_time': total_time,
        'locations_at_half_distance': waypoints_covered_at_half_distance
    })

# Write all stored generation results to CSV at the end
def write_results_to_csv(generation_results, best_route, total_distance, total_time, locations_at_half_distance):
    print("Writing all results to CSV files...")

    # Write generation results to CSV
    with open(csv_file_path, mode='w', newline='') as csv_file:
        fieldnames = ['generation', 'route_taken', 'total_distance', 'total_time', 'locations_at_half_distance']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()
        for result in generation_results:
            writer.writerow(result)

    # Write best route to separate CSV
    with open(best_route_csv_path, mode='w', newline='') as best_route_csv_file:
        fieldnames = ['best_route', 'total_distance', 'total_time', 'locations_at_half_distance']
        writer = csv.DictWriter(best_route_csv_file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerow({
            'best_route': ' -> '.join(best_route),
            'total_distance': total_distance,
            'total_time': total_time,
            'locations_at_half_distance': locations_at_half_distance
        })

    print(f"Results written to {csv_file_path} and {best_route_csv_path}")

def fitness(individual):
    global browser_instance
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
        total_distance, segment_distances, red_traffic_count = poll_for_results(task_id)
        print(f"Fitness function completed for task ID: {task_id}")

        # Calculate how many waypoints were traveled at half the total distance
        half_distance = total_distance / 2
        cumulative_distance = 0
        waypoints_covered_at_half_distance = 0
        for segment in segment_distances:
            cumulative_distance += segment
            if cumulative_distance >= half_distance:
                break
            waypoints_covered_at_half_distance += 1

        # Fitness is now a tuple of (total_distance + total_time_adjustment_minutes, -waypoints_covered_at_half_distance)
        return total_distance, -waypoints_covered_at_half_distance, red_traffic_count
    else:
        return float('inf'), 0,0

# DEAP setup
creator.create("FitnessMin", base.Fitness, weights=(-1.0, 1.0,-1.0))
creator.create("Individual", list, fitness=creator.FitnessMin)

toolbox = base.Toolbox()

if __name__ == "__main__":
    print("Starting the script...")
    locations = load_locations()  # Load locations here before using it

    toolbox.register("indices", random.sample, range(len(locations['waypoints'])), len(locations['waypoints']))
    toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", fitness)
    toolbox.register("mate", tools.cxOrdered)
    toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.05)
    toolbox.register("select", tools.selTournament, tournsize=3)

    population_size = 5
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

        generation_results = []  # List to store results for all generations

        for gen in range(generations):
            print(f"Generation {gen + 1}/{generations} started.")

            # Fitness evaluation
            fitnesses = list(map(toolbox.evaluate, pop))
            for ind, fit in zip(pop, fitnesses):
                ind.fitness.values = fit

            best_individual = tools.selBest(pop, 1)[0]
            best_waypoint_order = [locations['waypoints'][i]['location'] for i in best_individual]
            total_distance, waypoints_covered_at_half_distance, red_traffic_count = best_individual.fitness.values

            # Store the generation results
            store_generation_results(generation_results, gen, best_waypoint_order, total_distance, waypoints_covered_at_half_distance,red_traffic_count)

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
        return pop, hof, generation_results

    browser_instance = setup_headless_browser()
    try:
        pop, hof, generation_results = main()
        best_individual = hof[0]
        best_waypoint_order = [locations['waypoints'][i]['location'] for i in best_individual]
        best_route = [locations['origin']['location']] + best_waypoint_order + [locations['destination']['location']]
        total_distance, locations_at_half_distance, red_traffic_count = best_individual.fitness.values
        total_time = calculate_total_time(total_distance, red_traffic_count)
        print("Best route:", best_route)
        print("Shortest time:", total_time)
        write_results_to_csv(generation_results, best_route, total_distance, total_time, locations_at_half_distance)
    finally:
        browser_instance.quit()
