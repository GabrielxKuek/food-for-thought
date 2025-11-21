"""
RAG (Retrieval-Augmented Generation) handler for food and nutrition information
"""
import chromadb
from chromadb.utils import embedding_functions
import logging

logger = logging.getLogger(__name__)

class ArbitrationRAGChroma:
    def __init__(self, collection_name="nutrition_db"):
        """Initialize the RAG system with ChromaDB"""
        try:
            self.client = chromadb.Client()
            self.collection_name = collection_name
            
            # Create or get collection
            try:
                self.collection = self.client.get_collection(name=collection_name)
                logger.info(f"Loaded existing collection: {collection_name}")
            except:
                self.collection = self.client.create_collection(
                    name=collection_name,
                    embedding_function=embedding_functions.DefaultEmbeddingFunction()
                )
                logger.info(f"Created new collection: {collection_name}")
                
        except Exception as e:
            logger.error(f"Error initializing RAG: {e}")
            raise
    
    def add_food_data(self, food_name, nutritional_info, metadata=None):
        """Add food nutritional data to the database"""
        try:
            doc = f"{food_name}: {str(nutritional_info)}"
            self.collection.add(
                documents=[doc],
                metadatas=[metadata or {}],
                ids=[f"food_{food_name}_{id(nutritional_info)}"]
            )
            logger.info(f"Added food data: {food_name}")
        except Exception as e:
            logger.error(f"Error adding food data: {e}")
    
    def query_similar_foods(self, food_name, n_results=5):
        """Query for similar foods in the database"""
        try:
            results = self.collection.query(
                query_texts=[food_name],
                n_results=n_results
            )
            return results
        except Exception as e:
            logger.error(f"Error querying foods: {e}")
            return None
