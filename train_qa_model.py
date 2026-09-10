#!/usr/bin/env python3
"""
train_qa_model.py
Trains an NLP Semantic Vector Space and Intent Retrieval Model
for LactoGuard's Clinical Bovine & Dairy Voice Assistant.
Saves model artifact to model/qa_nlp_model.joblib.
"""

import os
import json
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

BASE_DIR = os.path.dirname(__file__)
DATASET_PATH = os.path.join(BASE_DIR, "data", "bovine_qa_dataset.json")
MODEL_OUTPUT_PATH = os.path.join(BASE_DIR, "model", "qa_nlp_model.joblib")

def train_qa_model():
    print("=" * 65)
    print("  LACTOGUARD NLP INTENT & SEMANTIC Q&A MODEL TRAINING")
    print("=" * 65)

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}. Run generate_qa_training_data.py first.")

    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    corpus_texts = []
    corpus_labels = []
    cluster_answers = {}
    cluster_categories = {}

    for cluster in data:
        cid = cluster["id"]
        answer = cluster["answer"]
        cat = cluster.get("category", "General")
        cluster_answers[cid] = answer
        cluster_categories[cid] = cat

        for q in cluster["questions"]:
            corpus_texts.append(q)
            corpus_labels.append(cid)

    print(f"Loaded {len(corpus_texts)} training questions across {len(cluster_answers)} intent clusters.")

    # Fit TF-IDF Vectorizer with Unigrams, Bigrams, and Trigrams
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=4000,
        sublinear_tf=True,
        lowercase=True,
        stop_words="english"
    )

    tfidf_matrix = vectorizer.fit_transform(corpus_texts)
    print(f"TF-IDF Vocabulary Size: {len(vectorizer.vocabulary_)} features")
    print(f"Training Matrix Shape: {tfidf_matrix.shape}")

    # Build Intent Centroids (mean vector for each cluster)
    centroids = {}
    labels_arr = np.array(corpus_labels)
    for cid in cluster_answers.keys():
        idx = np.where(labels_arr == cid)[0]
        sub_matrix = tfidf_matrix[idx]
        centroid = np.asarray(sub_matrix.mean(axis=0)).ravel()
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm
        centroids[cid] = centroid

    # Package model artifact
    model_bundle = {
        "vectorizer": vectorizer,
        "corpus_texts": corpus_texts,
        "corpus_labels": corpus_labels,
        "tfidf_matrix": tfidf_matrix,
        "centroids": centroids,
        "cluster_answers": cluster_answers,
        "cluster_categories": cluster_categories,
        "version": "2.0-groq-ready",
        "clusters_count": len(cluster_answers),
        "total_queries_trained": len(corpus_texts)
    }

    os.makedirs(os.path.dirname(MODEL_OUTPUT_PATH), exist_ok=True)
    joblib.dump(model_bundle, MODEL_OUTPUT_PATH)
    print(f"Model successfully trained and saved to: {MODEL_OUTPUT_PATH}")

    # Self-validation test
    test_queries = [
        ("Can we drink milk from cow with mastitis?", "mastitis_milk_safety"),
        ("What is recipe for aloe vera turmeric paste?", "icar_herbal_paste_recipe"),
        ("Cow cannot stand up after giving birth and neck is bent", "milk_fever_hypocalcemia"),
        ("What is the AM PM rule for insemination?", "am_pm_insemination_rule"),
        ("How many days is cow pregnant vs buffalo?", "gestation_period_cattle_buffalo"),
        ("Cow stomach swollen on left side and bloated", "bloat_tympany_ruminal_acidosis")
    ]

    print("\n--- Running Quick Self-Validation ---")
    correct = 0
    for q, expected_cid in test_queries:
        q_vec = vectorizer.transform([q])
        q_norm = np.asarray(q_vec.toarray()).ravel()
        q_len = np.linalg.norm(q_norm)
        if q_len > 0:
            q_norm = q_norm / q_len

        best_cid = None
        best_score = -1.0
        for cid, c_vec in centroids.items():
            score = float(np.dot(q_norm, c_vec))
            if score > best_score:
                best_score = score
                best_cid = cid

        is_match = (best_cid == expected_cid)
        if is_match:
            correct += 1
        print(f"Query: \"{q}\" -> Match: {best_cid} (Confidence: {best_score:.3f}) | {'PASS' if is_match else 'FAIL'}")

    acc = (correct / len(test_queries)) * 100.0
    print(f"\nValidation Accuracy: {acc:.1f}% ({correct}/{len(test_queries)})")
    print("=" * 65)

if __name__ == "__main__":
    train_qa_model()
