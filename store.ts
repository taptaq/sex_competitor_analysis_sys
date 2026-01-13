
import { create } from 'zustand';
import { supabase } from './services/supabase';
import { ViewType, Competitor, Product, ReviewAnalysis, AdCreative } from './types';

interface AppState {
  currentView: ViewType;
  selectedCompetitorId: string | null;
  competitors: Competitor[];
  setCurrentView: (view: ViewType) => void;
  setSelectedCompetitor: (id: string | null) => void;
  setCompetitors: (competitors: Competitor[]) => void;
  addCompetitor: (competitor: Competitor) => void;
  removeCompetitor: (id: string) => void;
  updateCompetitor: (competitor: Competitor) => void;
  
  // Loading State
  isLoading: boolean;

  
  // Product CRUD
  addProduct: (competitorId: string, product: Product) => void;
  updateProduct: (competitorId: string, product: Product) => void;
  removeProduct: (competitorId: string, productId: string) => void;
  
  // Ad CRUD
  addAd: (competitorId: string, ad: AdCreative) => void;
  updateAd: (competitorId: string, ad: AdCreative) => void;
  removeAd: (competitorId: string, adId: string) => void;

  setProductAnalysis: (competitorId: string, productId: string, analysis: ReviewAnalysis) => void;
  setProductReviews: (competitorId: string, productId: string, reviews: any[]) => void;
  fetchCompetitors: () => Promise<void>;
  
  // Selection
  selectedProductIds: string[];
  toggleProductSelection: (productId: string) => void;
  clearSelection: () => void;
  
  // Favorites
  favoriteProducts: Array<{
    productId: string;
    competitorId: string;
    // Save complete product object from competitors.json
    product: Product;
    // Save basic competitor info for reference
    competitorName: string;
    isDomestic?: boolean;
    savedAt?: string;
  }>;
  toggleFavoriteProduct: (product: Product, competitor: Competitor) => void;
  isProductFavorite: (productId: string) => boolean;
  fetchFavorites: () => Promise<void>;
  
  // Deep Reports
  deepReports: Array<{
    productId: string;
    competitorId: string;
    report: any;
    createdAt?: string;
    updatedAt?: string;
  }>;
  saveDeepReport: (productId: string, competitorId: string, report: any) => Promise<void>;
  getDeepReport: (productId: string) => any | null;
  fetchDeepReports: () => Promise<void>;

  saveStandardizationTest: (data: {
    productName: string;
    productId?: string;
    competitorId?: string;
    description?: string;
    parameters?: any;
    reviewsSample?: string;
    resultData: any;
  }) => Promise<void>;

  standardizationTests: any[];
  fetchStandardizationTests: () => Promise<void>;
  deleteStandardizationTest: (id: string) => Promise<void>;

  medicalTerms: any[];
  fetchMedicalTerms: () => Promise<void>;
  addMedicalTerm: (term: string, replacement: string, category?: string) => Promise<void>;
  removeMedicalTerm: (id: string) => Promise<void>;
}

// Helper to save to server - REMOVED, using direct Supabase calls
// const saveToServer = async (competitors: Competitor[]) => { ... }

export const useStore = create<AppState>((set, get) => ({
  currentView: ViewType.DASHBOARD,
  isLoading: false,
  selectedCompetitorId: null,
  competitors: [], // Initial empty state, will fetch on load
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedCompetitor: (id) => set({ selectedCompetitorId: id, currentView: id ? ViewType.COMPETITOR_DETAIL : ViewType.DASHBOARD }),
  setCompetitors: (competitors) => {
      set({ competitors });
  },
  

  
  fetchCompetitors: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('competitors')
        .select('*, products(*)');
      
      if (error) throw error;
      
      // Transform data if necessary (e.g. date fields, or ensure array existence)
      const formattedData = (data || []).map(comp => ({
          ...comp,
          brandCharacteristicAnalysis: comp.brand_characteristic_analysis,
          qaAnalysis: comp.qa_analysis,
          products: (comp.products || []).map((p: any) => ({
              ...p,
              launchDate: p.launch_date,
              priceHistory: p.price_history,
              priceAnalysis: p.price_analysis
          })),
          foundedDate: comp.founded_date, // Map snake_case to camelCase
          isDomestic: comp.is_domestic
      }));

      set({ competitors: formattedData as Competitor[] });
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    } finally {
        set({ isLoading: false });
    }
  },

  addCompetitor: async (competitor) => {
      // Optimistic update
      set((state) => ({ competitors: [...state.competitors, competitor] }));

      const { error } = await supabase.from('competitors').insert({
          id: competitor.id,
          name: competitor.name,
          domain: competitor.domain,
          country: competitor.country,
          founded_date: competitor.foundedDate,
          description: competitor.description,
          focus: competitor.focus,
          philosophy: competitor.philosophy,
          sentiment: competitor.sentiment,
          is_domestic: competitor.isDomestic
      });
      if (error) {
          console.error("Failed to add competitor to Supabase", error);
          // Revert or show toast? For now just log.
      }
  },
  removeCompetitor: async (id) => {
      set((state) => ({
        competitors: state.competitors.filter(c => c.id !== id),
        selectedCompetitorId: state.selectedCompetitorId === id ? null : state.selectedCompetitorId,
        currentView: state.selectedCompetitorId === id ? ViewType.DASHBOARD : state.currentView
      }));
      
      const { error } = await supabase.from('competitors').delete().eq('id', id);
      if (error) console.error("Failed to delete competitor", error);
  },
  updateCompetitor: async (updatedComp) => {
      set((state) => ({
        competitors: state.competitors.map(c => c.id === updatedComp.id ? updatedComp : c)
      }));

      const { error } = await supabase.from('competitors').update({
          name: updatedComp.name,
          domain: updatedComp.domain,
          country: updatedComp.country,
          founded_date: updatedComp.foundedDate,
          description: updatedComp.description,
          focus: updatedComp.focus,
          philosophy: updatedComp.philosophy,
          sentiment: updatedComp.sentiment,
          is_domestic: updatedComp.isDomestic
      }).eq('id', updatedComp.id);

      if (error) console.error("Failed to update competitor", error);
  },

  // Product Actions
  addProduct: async (competitorId, product) => {
      // Optimistic
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, products: [...(c.products || []), product] };
        });
        return { competitors: newCompetitors };
      });
      
      const { error } = await supabase.from('products').insert({
          id: product.id,
          competitor_id: competitorId,
          name: product.name,
          price: product.price,
          category: product.category,
          tags: product.tags,
          link: product.link,
          image: product.image,
          sales: product.sales,
          launch_date: product.launchDate,
          gender: product.gender,
          specs: product.specs,
          price_history: product.priceHistory,
          analysis: product.analysis
      });
      if (error) {
        console.error("Failed to add product", error);
        throw new Error(error.message);
      }
  },
  updateProduct: async (competitorId, product) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, products: c.products?.map(p => p.id === product.id ? product : p) || [] };
        });
        return { competitors: newCompetitors };
      });

      const { error } = await supabase.from('products').update({
          name: product.name,
          price: product.price,
          category: product.category,
          tags: product.tags,
          link: product.link,
          image: product.image,
          sales: product.sales,
          launch_date: product.launchDate,
          gender: product.gender,
          specs: product.specs,
          price_history: product.priceHistory,
          analysis: product.analysis
      }).eq('id', product.id);
      
      if (error) {
        console.error("Failed to update product", error);
        throw new Error(error.message);
      }
  },
  removeProduct: async (competitorId, productId) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, products: c.products?.filter(p => p.id !== productId) || [] };
        });
        return { competitors: newCompetitors };
      });
      
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) console.error("Failed to delete product", error);
  },

  // Ad Actions
  // Ad Actions - NOTE: Ads schema not fully defined in Supabase yet, skipping server persistence for now or storing in local state only?
  // User context implies Ads are part of Competitor. But we didn't add 'ads' column.
  // We will log a warning.
  addAd: (competitorId, ad) => {
      console.warn("Ads persistence not implemented in Supabase schema yet.");
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, ads: [...(c.ads || []), ad] };
        });
        return { competitors: newCompetitors };
      });
  },
  updateAd: (competitorId, ad) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, ads: c.ads?.map(a => a.id === ad.id ? ad : a) || [] };
        });
        return { competitors: newCompetitors };
      });
  },
  removeAd: (competitorId, adId) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, ads: c.ads?.filter(a => a.id !== adId) || [] };
        });
        return { competitors: newCompetitors };
      });
  },

  setProductAnalysis: async (competitorId, productId, analysis) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
          if (c.id !== competitorId) return c;
          const updatedProducts = c.products?.map(p => {
            if (p.id !== productId) return p;
            return { ...p, analysis };
          }) || [];
          return { ...c, products: updatedProducts };
        });
        return { competitors: newCompetitors };
      });
      
      const { error } = await supabase.from('products').update({ analysis }).eq('id', productId);
      if (error) console.error("Failed to update product analysis", error);
  },
  setProductReviews: async (competitorId, productId, newReviews) => {
      const reviewObjects = newReviews.map((reviewData, idx) => ({
          id: `new-${Date.now()}-${idx}`,
          text: typeof reviewData === 'object' ? JSON.stringify(reviewData) : String(reviewData),
          sentiment: 'positive' as const,
          keywords: []
      }));
      
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
          if (c.id !== competitorId) return c;
          const updatedProducts = c.products?.map(p => {
            if (p.id !== productId) return p;
            return { ...p, reviews: reviewObjects };
          }) || [];
          return { ...c, products: updatedProducts };
        });
        return { competitors: newCompetitors };
      });
      
      const { error } = await supabase.from('products').update({ reviews: reviewObjects }).eq('id', productId);
      if (error) console.error("Failed to update product reviews", error);
  },

  // Selection Actions
  selectedProductIds: [],
  toggleProductSelection: (productId) => {
    set((state) => {
      const isSelected = state.selectedProductIds.includes(productId);
      const newSelection = isSelected 
        ? state.selectedProductIds.filter(id => id !== productId)
        : [...state.selectedProductIds, productId];
      return { selectedProductIds: newSelection };
    });
  },
  clearSelection: () => set({ selectedProductIds: [] }),
  
  // Favorites Actions
  favoriteProducts: [],
  toggleFavoriteProduct: async (product, competitor) => {
    const isFavorite = get().favoriteProducts.some(fav => fav.productId === product.id);

    // Optimistic Update
    set((state) => {
      let newFavorites;
      if (isFavorite) {
        newFavorites = state.favoriteProducts.filter(fav => fav.productId !== product.id);
      } else {
         newFavorites = [...state.favoriteProducts, {
          productId: product.id,
          competitorId: competitor.id,
          product: { ...product },
          competitorName: competitor.name,
          isDomestic: competitor.isDomestic ?? true,
          savedAt: new Date().toISOString()
        }];
      }
      return { favoriteProducts: newFavorites };
    });

    // Side Effect
    try {
        if (isFavorite) {
            await supabase.from('favorites').delete().eq('product_id', product.id);
        } else {
            await supabase.from('favorites').insert({ product_id: product.id });
        }
    } catch (err) {
        console.error("Failed to toggle favorite in Supabase", err);
        // Revert? For now just log.
        get().fetchFavorites(); // Re-sync in case of error
    }
  },
  isProductFavorite: (productId) => {
    return get().favoriteProducts.some(fav => fav.productId === productId);
  },
  fetchFavorites: async () => {
    try {
      const { data, error } = await supabase.from('favorites').select('*, products(id, name, price, category, image, competitor_id, competitors(name, is_domestic))');
      if (error) throw error;
      
      // Reshape data to match app state
      const mappedFavorites = data.map((fav: any) => ({
          productId: fav.product_id,
          competitorId: fav.products?.competitor_id,
          product: fav.products,
          competitorName: fav.products?.competitors?.name,
          isDomestic: fav.products?.competitors?.is_domestic,
          savedAt: fav.created_at
      }));
      set({ favoriteProducts: mappedFavorites });
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  },
  
  // Deep Reports Actions
  deepReports: [],
  saveDeepReport: async (productId, competitorId, report) => {
    try {
      const { error } = await supabase.from('deep_reports').upsert({
          product_id: productId,
          competitor_id: competitorId,
          report: report
      }, { onConflict: 'product_id' }); // Assuming one report per product? Or multiple?
      
      if (error) throw error;
      
      // Refresh reports after saving
      get().fetchDeepReports();
    } catch (error) {
      console.error('Failed to save deep report:', error);
      throw error;
    }
  },
  getDeepReport: (productId) => {
    const report = get().deepReports.find(r => r.productId === productId);
    return report ? report.report : null;
  },
  fetchDeepReports: async () => {
    try {
      const { data, error } = await supabase.from('deep_reports').select('*');
      if (error) throw error;
      
      const mappedReports = data.map((r: any) => ({
          productId: r.product_id,
          competitorId: r.competitor_id,
          report: r.report,
          createdAt: r.created_at,
          updatedAt: r.updated_at
      }));
      set({ deepReports: mappedReports });
    } catch (error) {
      console.error('Failed to fetch deep reports:', error);
    }
  },

  // Standardization/Lie Detector History
  saveStandardizationTest: async (data: {
    productName: string;
    productId?: string;
    competitorId?: string;
    description?: string;
    parameters?: any;
    reviewsSample?: string;
    resultData: any;
  }) => {
    try {
      const { error } = await supabase.from('standardization_tests').insert({
        product_name: data.productName,
        product_id: data.productId || null,
        competitor_id: data.competitorId || null,
        description: data.description,
        parameters: data.parameters,
        reviews_sample: data.reviewsSample,
        result_data: data.resultData
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Failed to save standardization test:", error);
      throw error;
    }
  },

  standardizationTests: [],
  fetchStandardizationTests: async () => {
    try {
      const { data, error } = await supabase
        .from('standardization_tests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      set({ standardizationTests: data });
    } catch (error) {
      console.error('Failed to fetch standardization tests:', error);
    }
  },
  deleteStandardizationTest: async (id) => {
    set((state) => ({
      standardizationTests: state.standardizationTests.filter(t => t.id !== id)
    }));
    try {
      const { error } = await supabase.from('standardization_tests').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Failed to delete standardization test:', error);
      // Revert if failed? For now just log, assuming UI is done.
      get().fetchStandardizationTests();
    }
  },

  // Medical Vocabulary
  medicalTerms: [],
  fetchMedicalTerms: async () => {
    try {
      const { data, error } = await supabase.from('medical_terminology').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      set({ medicalTerms: data });
    } catch (error) {
      console.error('Failed to fetch medical terms:', error);
    }
  },
  addMedicalTerm: async (term, replacement, category) => {
    // Optimistic
    const newTerm = { id: `temp-${Date.now()}`, term, replacement, category, created_at: new Date().toISOString() };
    set(state => ({ medicalTerms: [newTerm, ...state.medicalTerms] }));

    const { data, error } = await supabase.from('medical_terminology').insert({ term, replacement, category }).select();
    if (error) {
       console.error("Failed to add medical term", error);
       // Revert fetch
       get().fetchMedicalTerms();
    } else if (data) {
       // Update with real ID
       set(state => ({ 
         medicalTerms: state.medicalTerms.map(t => t.id === newTerm.id ? data[0] : t) 
       }));
    }
  },
  removeMedicalTerm: async (id) => {
    set(state => ({ medicalTerms: state.medicalTerms.filter(t => t.id !== id) }));
    const { error } = await supabase.from('medical_terminology').delete().eq('id', id);
    if (error) console.error("Failed to delete medical term", error);
  }
}));
