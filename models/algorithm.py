import random
import numpy as np
from deap import base, creator, tools, algorithms
import json

# Load locations from JSON file
def load_locations():
    with open('locations.json', 'r') as file:
        locations = json.load(file)
    return locations

# Load distances from JSON file
def load_distances():
    with open('distances.json', 'r') as file:
        data = json.load(file)
    total_distance = data['totalDistance']
    segment_distances = data['segmentDistances']
    return total_distance, segment_distances

# Load the data
locations = load_locations()
total_distance, segment_distances = load_distances()

# Create the fitness function
def fitness(individual):
    total_distance = 0
    for i in range(len(individual) - 1):
        total_distance += segment_distances[individual[i]]
    total_distance += segment_distances[individual[-1]]  # return to starting point
    travel_time = total_distance / 15  # assuming speed of travel is 15 meters per second
    return travel_time,

# Convert time from seconds to minutes and seconds
def convert_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes} minutes, {seconds} seconds"



# DEAP setup
creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
creator.create("Individual", list, fitness=creator.FitnessMin)

toolbox = base.Toolbox()
toolbox.register("indices", random.sample, range(len(locations)), len(locations))
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

    pop, log = algorithms.eaSimple(pop, toolbox, cxpb=crossover_probability, 
                                   mutpb=mutation_probability, ngen=generations, 
                                   stats=stats, halloffame=hof, verbose=True)

    return pop, log, hof

if __name__ == "__main__":
    locations = load_locations()
    total_distance, distances = load_distances()
    pop, log, hof = main()
    best_individual = hof[0]
    best_route = [list(locations.keys())[i] for i in best_individual]
    shortest_time_seconds = fitness(best_individual)[0]
    shortest_time_formatted = convert_time(shortest_time_seconds)
    print("Best route:", best_route)
    print("Shortest time (seconds):", shortest_time_formatted)
