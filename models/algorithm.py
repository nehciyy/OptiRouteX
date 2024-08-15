import random
import numpy as np
from deap import base, creator, tools, algorithms
import json
import os
import requests
import csv
import time
import webbrowser

# Set the correct path to JSON files
script_dir = os.path.dirname(__file__)
locations_path = os.path.join(script_dir, 'locations.json')
output_path = os.path.join(script_dir, 'best_route.json')

# Load locations from JSON file
def load_locations():
    with open(locations_path, 'r') as file:
        locations = json.load(file)
    return locations

# Load the data
locations = load_locations()

# Assuming your Flask app is running on http://localhost:5000
route_calculation_url = "http://localhost:5000/calculate-route"
results_url_template = "http://localhost:5000/get-results/{}"

# Poll for results
def poll_for_results(task_id):
    url = results_url_template.format(task_id)
    while True:
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'complete':
                return data['total_distance'], data['segment_distances']
        time.sleep(1)  # Wait for 1 second before polling again

# Create the fitness function
def fitness(individual):
    # Get the list of waypoints using the indices from the individual
    waypoints = [locations['waypoints'][i] for i in individual]

    # Prepare the data payload
    data = {
        "origin": locations['origin'],
        "destination": locations['destination'],
        "waypoints": waypoints
    }

    # Call the Flask API to calculate the route
    response = requests.post(route_calculation_url, json=data)
    
    if response.status_code == 202:  # Accepted, task has started processing
        task_id = response.json().get("task_id")
    
        # Open the URL with the task_id in the default web browser
        url_to_open = f"http://localhost:8000/?task_id={task_id}"
        print(f"Opening browser for task ID: {task_id}")
        webbrowser.open(url_to_open)
   
        # Poll for the results
        total_distance, segment_distances = poll_for_results(task_id)
        return total_distance, segment_distances
    else:
        # Handle errors by assigning a large distance, effectively penalizing the individual
        print(f"Error calculating route: {response.text}")
        return float('inf'),

# Save the best route to a JSON file
def save_best_route(best_route, shortest_time_formatted):
    output_data = {"best_route": best_route, "shortest_time": shortest_time_formatted}
    with open(output_path, 'w') as outfile:
        json.dump(output_data, outfile, indent=4)
    print(f"Best route saved to {output_path}")
    
# Convert time from seconds to minutes and seconds
def convert_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes} minutes, {seconds} seconds"

# DEAP setup
creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

# Register the tools
toolbox = base.Toolbox()

# Use indices directly from the length of the waypoints list
toolbox.register("indices", random.sample, range(len(locations['waypoints'])), len(locations['waypoints']))
toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
toolbox.register("population", tools.initRepeat, list, toolbox.individual)

toolbox.register("evaluate", fitness)
toolbox.register("mate", tools.cxOrdered)
toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.05)
toolbox.register("select", tools.selTournament, tournsize=3)

# Genetic Algorithm parameters
population_size = 300
crossover_probability = 0.8
mutation_probability = 0.2
generations = 100

# Genetic Algorithm
def main():
    pop = toolbox.population(n=population_size)
    hof = tools.HallOfFame(1)
    stats = tools.Statistics(lambda ind: ind.fitness.values)
    stats.register("avg", np.mean)
    stats.register("min", np.min)
    stats.register("max", np.max)

    # Prepare the CSV file
    csv_file_path = os.path.join(script_dir, 'generation_results.csv')
    with open(csv_file_path, mode='w', newline='') as csv_file:
        fieldnames = ['generation', 'route_taken', 'total_distance', 'total_time', 'total_time_at_half_distance']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        writer.writeheader()

        for gen in range(generations):
            print(f"Generation {gen + 1}/{generations}")
            
            # Evaluate the entire population
            fitnesses = list(map(toolbox.evaluate, pop))
            
            for ind, fit in zip(pop, fitnesses):
                ind.fitness.values = fit

            # Find the best individual in this generation
            best_individual = tools.selBest(pop, 1)[0]
            best_waypoint_order = [locations['waypoints'][i]['location'] for i in best_individual]

            # Calculate the total distance and time
            total_distance, segment_distances = fitness(best_individual)
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

            # Record the generation data in the CSV
            writer.writerow({
                'generation': gen + 1,
                'route_taken': ' -> '.join(['origin'] + best_waypoint_order + ['destination']),
                'total_distance': total_distance,
                'total_time': total_time_formatted,
                'total_time_at_half_distance': time_at_half_distance_formatted
            })

            # Select the next generation individuals
            offspring = toolbox.select(pop, len(pop))
            
            # Clone the selected individuals
            offspring = list(map(toolbox.clone, offspring))
            
            # Apply crossover and mutation on the offspring
            for child1, child2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < crossover_probability:
                    toolbox.mate(child1, child2)
                    del child1.fitness.values
                    del child2.fitness.values
            
            for mutant in offspring:
                if random.random() < mutation_probability:
                    toolbox.mutate(mutant)
                    del mutant.fitness.values

            # Evaluate the individuals with an invalid fitness
            invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
            fitnesses = map(toolbox.evaluate, invalid_ind)
            
            for ind, fit in zip(invalid_ind, fitnesses):
                ind.fitness.values = fit

            # Replace population with offspring
            pop[:] = offspring
            
            # Update the statistics
            record = stats.compile(pop)
            print(record)
            
            hof.update(pop)
    
    return pop, hof

if __name__ == "__main__":
    # Load locations from the JSON file
    locations = load_locations()

    # Run the genetic algorithm
    pop, hof = main()
    
    # Extract the best individual from the Hall of Fame
    best_individual = hof[0]
    
    # Extract the best waypoint order
    best_waypoint_order = [locations['waypoints'][i]['location'] for i in best_individual]
    
    # Include origin and destination in the best route
    best_route = [locations['origin']['location']] + best_waypoint_order + [locations['destination']['location']]
    
    # Calculate the fitness (which includes calling the route calculation)
    total_distance, segment_distances = fitness(best_individual)
    
    # Calculate the total time taken
    shortest_time_seconds = total_distance / 15  # Assuming speed of travel is 15 meters per second
    shortest_time_formatted = convert_time(shortest_time_seconds)
    
    # Print the best route and time
    print("Best route:", best_route)
    print("Shortest time (seconds):", shortest_time_formatted)
    
    # Save the best route to a JSON file
    save_best_route(best_route, shortest_time_formatted)
