# ==============================================================================
# PIP INSTALLATION COMMAND:
# pip install langchain langchain-community langchain-chroma langchain-huggingface langchain-openai chromadb sentence-transformers python-dotenv
# ==============================================================================

import os
import sys
from pathlib import Path

# Load environment variables if .env file exists
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Document Loader
from langchain_community.document_loaders import TextLoader

# Text Splitter (supports both modern langchain-text-splitters and legacy langchain)
try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
except ImportError:
    from langchain.text_splitter import RecursiveCharacterTextSplitter

# HuggingFace Embeddings (free, local, open-source)
try:
    from langchain_huggingface import HuggingFaceEmbeddings
except ImportError:
    from langchain_community.embeddings import HuggingFaceEmbeddings

# Local Persistent Chroma Vector Store
try:
    from langchain_chroma import Chroma
except ImportError:
    from langchain_community.vectorstores import Chroma

# OpenAI Chat Model
from langchain_openai import ChatOpenAI

# Core LCEL components & Prompt Templates
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser


def check_api_key():
    """Ensure OPENAI_API_KEY is available in the environment."""
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("\n[!] OPENAI_API_KEY not found in environment.")
        user_key = input("Please enter your OpenAI API key (sk-...): ").strip()
        if not user_key:
            print("[X] An OpenAI API key is required to run the LLM. Exiting.")
            sys.exit(1)
        os.environ["OPENAI_API_KEY"] = user_key


def ensure_dataset_exists(file_path: str = "my_dataset.txt"):
    """Creates a sample bovine clinical dataset if the file does not exist."""
    if not os.path.exists(file_path):
        print(f"[+] Dataset '{file_path}' not found. Generating default cow dataset...")
        default_content = """[SECTION: INDIGENOUS & CROSSBRED DAIRY BREEDS]
Gir Cattle:
Gir is a premier indigenous zebu dairy breed originating from Gujarat. Known for convex forehead and pendulous long curled ears. Average daily milk yield is 14 to 20 liters with 4.5% to 5.0% fat and A2 beta-casein protein. They possess high heat tolerance and tick resistance.

Sahiwal Cattle:
Sahiwal is a reddish-dun milch breed from the Montgomery region with loose skin and prominent dewlap. Daily milk yield is 12 to 18 liters with 4.5% fat. They have lower susceptibility to subclinical mastitis.

Murrah Buffalo:
Originating from Haryana and Punjab, Murrah is jet black with tightly curled spiral horns. Daily yield ranges from 12 to 22 liters with 7.0% to 8.5% milk fat. Gestation period is 305 to 315 days compared to 280 to 285 days for cows.

HF Crossbred Cattle:
Holstein Friesian crossbreds achieve peak yields of 20 to 35 liters per day but have higher susceptibility to heat stress and clinical mastitis.

[SECTION: BOVINE MASTITIS & ELECTRICAL CONDUCTIVITY]
Subclinical Mastitis:
No visible swelling or milk clotting, but cellular damage leads to sodium and chloride leakage into milk, elevating electrical conductivity (EC) and Somatic Cell Count (SCC). Causes a 10% to 25% yield loss.

Clinical Mastitis:
Visible udder swelling, heat, fever (>39.5°C), and abnormal milk containing flakes, clots, or blood.

4-Quarter EC Thresholds:
- Healthy Quarter: EC 4.20 to 5.50 mS/cm.
- Subclinical Warning: EC 5.50 to 7.00 mS/cm (detectable 48-72 hours before visible symptoms).
- Acute Mastitis: EC > 7.00 mS/cm.
- Quarter Disparity Rule: Variance > 0.50 mS/cm between quarters indicates infection in the higher quarter.

[SECTION: SOMATIC CELL COUNT & MILK pH]
- Healthy SCC: Less than 200,000 cells/mL.
- Subclinical SCC: 200,000 to 500,000 cells/mL.
- Clinical SCC: Greater than 500,000 cells/mL.
- Normal Milk pH: 6.50 to 6.75.
- Mastitic Milk pH: 6.85 to 7.40 (alkaline shift due to blood electrolyte permeability).

[SECTION: ICAR HERBAL REMEDY RECIPE]
Ingredients:
- Fresh Aloe vera leaves: 250g
- Turmeric powder (Curcuma longa): 50g
- Slaked Lime / Chuna (Calcium hydroxide): 15g
- Mustard oil: 50ml
Preparation & Application:
Grind into a smooth golden paste. Apply thoroughly over affected quarter 3 times daily for 5 continuous days after complete milking. Cures 85% to 92% of subclinical cases without antibiotic residues.

[SECTION: EMERGENCY PHARMACOLOGY & SYSTEMIC DISEASES]
- Acute Mastitis Pain Relief: Administer Meloxicam (0.5 mg/kg body weight IV/IM). Never use banned Diclofenac.
- Milk Fever (Hypocalcemia): Rapid calcium loss post-calving. Symptoms include S-shape neck curve and subnormal temp (<38.0°C). Emergency treatment: Slow IV infusion of 450ml Calcium Borogluconate (25% CBG).
- Acute Bloat: Distension of left paralumbar fossa. Field treatment: Drench with 250ml to 500ml vegetable cooking oil mixed with 20ml turpentine oil.

[SECTION: REPRODUCTION & CALF MANAGEMENT]
- AM-PM Rule: A cow showing standing heat in the morning (AM) must be inseminated in the evening (PM). Heat in evening (PM) must be inseminated the next morning (AM).
- Gestation: Cows 280-285 days; Buffaloes 305-315 days.
- Colostrum Feeding: Calves must receive first colostrum within 1-2 hours of birth at 10% of body weight (3-4L) for maternal IgG transfer. Dip navel in 7% tincture iodine.

[SECTION: SURABHI DAIRY HERD TELEMETRY]
- Kaveri (COW-108, HF Cross, 4.0 yrs): ACUTE CLINICAL MASTITIS in Left Front (LF). EC LF 8.12 mS/cm, SCC 980k, Temp 40.2°C, Yield dropped from 20L to 8.5L (-57%). Action: Isolate and call vet.
- Kamdhenu (COW-102, Sahiwal, 5.0 yrs): SUBCLINICAL 48h WARNING in Right Hind (RH). EC RH 6.40 mS/cm, SCC 290k, Yield 13.8L. Action: Apply ICAR herbal paste 3x daily for 5 days.
- Lakshmi (COW-101, Gir, 4.5 yrs): OPTIMAL HEALTH. All 4 quarters EC < 4.90 mS/cm, SCC 120k, Milk 18.2L, pH 6.60.
"""
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(default_content.strip())
        print(f"[✓] Created '{file_path}' successfully.")


def format_docs(docs):
    """Formats retrieved document chunks into a single string for the prompt context."""
    return "\n\n".join(doc.page_content for doc in docs)


def build_rag_pipeline(dataset_path: str = "my_dataset.txt", chroma_dir: str = "./chroma_db"):
    """
    Builds the complete LangChain RAG pipeline:
    1. Loads dataset
    2. Chunks with RecursiveCharacterTextSplitter (500 chars, 50 overlap)
    3. Embeds chunks with HuggingFace (all-MiniLM-L6-v2) into local persistent Chroma DB
    4. Configures custom prompt & retrieval chain with OpenAI Chat model
    """
    ensure_dataset_exists(dataset_path)

    # 1. DATA LOADING
    print(f"\n[1/4] Loading document from '{dataset_path}'...")
    loader = TextLoader(dataset_path, encoding="utf-8")
    raw_documents = loader.load()
    print(f"      Loaded {len(raw_documents)} document(s) ({len(raw_documents[0].page_content)} characters).")

    # 2. CHUNKING
    print("\n[2/4] Splitting text into 500-character chunks (overlap: 50)...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )
    chunks = text_splitter.split_documents(raw_documents)
    print(f"      Created {len(chunks)} document chunks.")

    # 3. VECTOR STORE WITH EMBEDDINGS
    print("\n[3/4] Initializing HuggingFace Embeddings (sentence-transformers/all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

    print(f"      Indexing chunks into persistent local Chroma database at '{chroma_dir}'...")
    vector_store = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=chroma_dir
    )
    
    # Configure retriever with top-k similarity
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )

    # 4. LLM & RETRIEVAL CHAIN WITH STRICT PROMPT
    print("\n[4/4] Setting up OpenAI LLM & Strict RAG Prompt Chain...")
    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.0  # Zero temperature prevents hallucinations and ensures deterministic grounding
    )

    prompt_template = """You are an expert AI assistant specializing in bovine health and dairy herd management.

Answer the user's question STRICTLY and ONLY using the retrieved context provided below.
Do not use any prior training knowledge outside of this context.
If the answer is not contained in the context, or if you cannot determine the answer with certainty from the context, you MUST respond exactly with: "I don't know."

Retrieved Context:
{context}

User Question:
{question}

Answer:"""

    prompt = ChatPromptTemplate.from_template(prompt_template)

    # LCEL (LangChain Expression Language) Retrieval Chain
    rag_chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough()
        }
        | prompt
        | llm
        | StrOutputParser()
    )

    print("      RAG pipeline assembled successfully!\n")
    return rag_chain, retriever


def interactive_chat():
    """Runs the real-time interactive command-line loop."""
    print("=" * 70)
    print("       🐄 BOVINE HERD RAG CHATBOT (LangChain + Chroma + OpenAI)       ")
    print("=" * 70)

    # Ensure API key is configured before starting
    check_api_key()

    # Build or load pipeline
    rag_chain, retriever = build_rag_pipeline()

    print("=" * 70)
    print("Chatbot is ready! Ask any question about your cows, mastitis, breeds, or herd data.")
    print("Commands:")
    print("  Type 'exit', 'quit', or 'q' to end the session.")
    print("  Type 'source <question>' to see the raw retrieved chunks from Chroma DB.")
    print("=" * 70)

    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit", "q"]:
                print("\nGoodbye! Happy dairy farming! 🌾")
                break

            # Optional inspect retrieved source chunks
            if user_input.lower().startswith("source "):
                raw_q = user_input[7:].strip()
                docs = retriever.invoke(raw_q)
                print(f"\n[Retrieved {len(docs)} chunks from Chroma DB]:")
                for idx, d in enumerate(docs, 1):
                    print(f"\n--- Chunk #{idx} ---")
                    print(d.page_content)
                continue

            # Run RAG chain
            response = rag_chain.invoke(user_input)
            print(f"\nAI: {response}")

        except KeyboardInterrupt:
            print("\n\nSession interrupted by user. Exiting...")
            break
        except Exception as err:
            print(f"\n[Error]: {err}")


if __name__ == "__main__":
    interactive_chat()
