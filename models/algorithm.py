import random
import numpy as np
from deap import base, creator, tools, algorithms
import geopy.distance

#latitude and longitude  taken from https://www.findlatitudeandlongitude.com/
locations = {"A":(1.28668,103.853607), #Merlion
             "B":(1.301114,103.838872), #313 Somerset
             "C":(1.28437,103.8599), #Marina Bay Sands
             "D":(1.281517,103.865774), #Gardens by the Bay
             "E":(1.289299,103.863137)} #Singapore Flyer

# Calculate distance between two points
def calculate_distance(locations):
    keys = list(locations.keys())
    distance_matrix = np.zeros((len(keys), len(keys)))
    for i, key1 in enumerate(keys):
        for j, key2 in enumerate(keys):
            if i != j:
                point1 = locations[key1]
                point2 = locations[key2]
                distance_matrix[i][j] = geopy.distance.distance(point1, point2).meters
    return distance_matrix

distance_matrix = calculate_distance(locations)

# Create the fitness function
def fitness(individual):
    total_distance = 0
    for i in range (len(individual)-1):
        total_distance += distance_matrix[individual[i]][individual[i+1]]
    total_distance += distance_matrix[individual[-1]][individual[0]] # return to starting point
    travel_time = total_distance /15 # assuming speed of travel is 15 meters per second
    return travel_time,

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


# Convert time from seconds to minutes and seconds
def convert_time(seconds):
    minutes = int(seconds // 60)
    seconds = int(seconds % 60)
    return f"{minutes} minutes, {seconds} seconds"

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
    pop, log, hof = main()
    best_individual = hof[0]
    best_route = [list(locations.keys())[i] for i in best_individual]
    shortest_time_seconds = fitness(best_individual)[0]
    shortest_time_formatted = convert_time(shortest_time_seconds)
    print("Best route:", best_route)
    print("Shortest time (seconds):", shortest_time_formatted)
