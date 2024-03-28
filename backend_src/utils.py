import pandas as pd
import matplotlib.pyplot as plt

def gene_chip_conversion(chip, prob_set_id):
    if chip[chip["Probe Set ID"] == prob_set_id]["Gene Symbol"].size >= 1:
        return chip[chip["Probe Set ID"] == prob_set_id]["Gene Symbol"].values[0]
    else:
        return None
    