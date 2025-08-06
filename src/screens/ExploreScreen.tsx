// @ts-nocheck
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  BackHandler,
} from 'react-native';
import WebView from 'react-native-webview';
import Background from '../components/Background';
import SearchBar from '../components/SearchBar';
import EcomTile from '../components/EcomTile';
import LatestPurchasesTile from '../components/LatestPurchasesTile';
import PiePayBottomSheet from '../components/bottomSheet';

// ---------- mock data ---------- //
const MOCK_MERCHANTS = [
  {
    id: 'flipkart',
    name: 'Flipkart',
    logoUrl:
      'https://www.google.com/url?sa=i&url=https%3A%2F%2Fin.pinterest.com%2Fpin%2Fflipkart-logo-png-images--850547079633661907%2F&psig=AOvVaw08MSXC-TTcdes9F2TB-q1D&ust=1753611827273000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCIDijaKn2o4DFQAAAAAdAAAAABAE',
    websiteUrl: 'https://www.flipkart.com',
    categories: [
      {
        title: 'Mobiles',
        imageUrl: 'https://img.icons8.com/fluency/96/000000/iphone-x1.png',
        productPageUrl: 'https://www.flipkart.com/mobile-phones-store',
      },
      {
        title: 'Fashion',
        imageUrl:
          'https://photo-cdn2.icons8.com/5-TM0TBn2MG_IrbA7Pn5I9ZbCV2t8i-WmyZNh6m3nKE/rs:fit:576:385/czM6Ly9pY29uczgu/bW9vc2UtcHJvZC5h/c3NldHMvYXNzZXRz/L3NhdGEvb3JpZ2lu/YWwvNzkzLzhhMTIw/Mjg5LWIyMmItNGI1/Yy05ZWQzLWZlZDVh/YzE0MDRjZC5qcGc.webp',
        productPageUrl: 'https://www.flipkart.com/clothing/pr?sid=2oq',
      },
      {
        title: 'Electronics',
        imageUrl: 'https://img.icons8.com/fluency/96/000000/laptop.png',
        productPageUrl:
          'https://www.flipkart.com/flipkart-electronics-new-store',
      },
      {
        title: 'Home',
        imageUrl: 'https://img.icons8.com/fluency/96/000000/sofa.png',
        productPageUrl: 'https://www.flipkart.com/furniture-store',
      },
      {
        title: 'Beauty',
        imageUrl:
          'https://photo-cdn2.icons8.com/4vvSfsIqLqnZk9FRQx-5gU4hNZ8PMElu0ufJB63oEQY/rs:fit:576:385/czM6Ly9pY29uczgu/bW9vc2UtcHJvZC5h/c3NldHMvYXNzZXRz/L3NhdGEvb3JpZ2lu/YWwvNDMyL2MwZDhi/NWI5LTFmZmItNGNh/Yy05YTg0LTY3NGRi/ZjQxZTFkYS5qcGc.webp',
        productPageUrl:
          'https://www.flipkart.com/beauty-and-personal-care/pr?sid=t06',
      },
      {
        title: 'Toys',
        imageUrl: 'https://img.icons8.com/fluency/96/000000/teddy-bear.png',
        productPageUrl: 'https://www.flipkart.com/toys-online-store',
      },
    ],
  },
];

const MOCK_PRODUCTS = [
  {
    id: 1,
    title: 'iPhone 14',
    imageUrl: 'https://m.media-amazon.com/images/I/61BGE6iu4AL._AC_UY218_.jpg',
    price: 79999,
    productPageUrl:
      'https://www.flipkart.com/apple-iphone-14-starlight-128-gb/p/itm3485a56f6e676?pid=MOBGHWFHABH3G73H',
  },
  {
    id: 2,
    title: 'Nike Sneakers',
    imageUrl:
      'https://static.nike.com/a/images/t_PDP_936_v1/f_auto,q_auto:eco/44f222ab-96b6-43b9-82e7-9a1bd888611d/NIKE+COURT+VISION+LO.png',
    price: 4599,
    productPageUrl:
      'https://www.flipkart.com/nike-blazer-low-platform-sneakers-women/p/itm23e5c1871e94d?pid=SHOGTHZ23WDFHHYM',
  },
  {
    id: 3,
    title: 'Dell Laptop',
    imageUrl:
      'https://5.imimg.com/data5/ND/GA/MY-44419499/dell-mini-laptop.jpg',
    price: 55999,
    productPageUrl:
      'https://www.flipkart.com/dell-latitude-3440-2024-intel-core-i3-12th-gen-1215u-8-gb-512-gb-ssd-windows-11-pro-business-laptop/p/itm7f265faf0871e?pid=COMH5G3F8BGPNY9N',
  },
  {
    id: 3,
    title: 'Wrist Watch',
    imageUrl:
      'https://www.vaerwatches.com/cdn/shop/files/38-wristWrist-Shot-Lime.jpg?v=1712715073&width=600',
    price: 2499,
    productPageUrl:
      'https://www.flipkart.com/lorenz-mk-4087r-date-dial-analog-watch-blue-magnetic-lock-strap-men/p/itm50682d1116646?pid=WATGZDGQF8GYFA5Y',
  },
];

const ExploreScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [webUri, setWebUri] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [showPiePaySheet, setShowPiePaySheet] = useState(false);

  //Fix: Android back button for main WebView
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webUri) {
        setWebUri(null);
        return true;
      }
      return false;
    });
    return () => backHandler.remove(); 
  }, [webUri]);

 // Fix: Memoized callbacks to prevent unnecessary re-renders

  const onSubmitSearch = useCallback(() => {
    setWebUri('https://www.flipkart.com/search?q=' + searchQuery);
    setSearchQuery('');
  }, [searchQuery]);

  const handleMerchantPress = useCallback(()=>{
    setWebUri('https://www.flipkart.com');
  }, []);

  const handleRemoveProduct = useCallback((id) => {
    setProducts(prevProducts => {
      const newProducts = prevProducts.filter(p => p.id !== id);
      return newProducts;
    });
  }, []);

  // const _ = Array.from({ length: 2000000 }, (_, i) => i * Math.random()).sort(
  //   (a, b) => b - a,
  // );

  // Fix: Optimized data Structure for FlatList
  const listData = useMemo(()=> [
    {type: 'header', key: 'header' },
    {type: 'search', key: 'search' },
    ...MOCK_MERCHANTS.map(merchant => ({ type: 'merchant', key: merchant.id, data: merchant })),
    { type: 'products', key: 'products' },
  ], []);

  //Fix: Optimized renderItem
  const renderItem = useCallback(({ item })=> {
    switch (item.type){
      case 'header': 
      return <HeaderSection/>;
      case 'search': 
      return(
        <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search products, categories, ..."
        onSubmit={onSubmitSearch}
        />
      );
      case 'merchant': 
       return(
        <LatestPurchasesTile
        products={products}
        onRemove={handleRemoveProduct}
        />
       );
       default: 
        return null;
    }
  }, [searchQuery, onSubmitSearch, handleMerchantPress, products, handleRemoveProduct]);

  return (
    <Background>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        removeClippedSubviews={true}
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 200, // Approximate item height
          offset: 200 * index,
          index,
        })}
      />

      {/* WebView modal */}
      <Modal visible={!!webUri} animationType="slide">
        <View style={{ flex: 1 }}>
          <Pressable style={styles.closeBtn} onPress={() => setWebUri(null)}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          {webUri && (
            <WebView
              // ref={WEBVIEW_REF}
              source={{ uri: webUri }}
              startInLoadingState
              onNavigationStateChange={(navState)=> {
                setCurrentUrl(navState.url);
                const isProductPage = navState.url.includes('flipkart.com') && navState.url.includes('/p/');
                setShowPiePaySheet(isProductPage);
              }}
            />
          )}
        </View>
      </Modal>
      <PiePayBottomSheet
        url={currentUrl}
        visible={showPiePaySheet}
        onClose={()=> setShowPiePaySheet(false)}
      />
    </Background>
  );
};

export default ExploreScreen;

// ---------------- internal components ---------------- //
const HeaderSection = React.memo(() => {
  return (
    <View style={headerStyles.container}>
      <Text style={headerStyles.welcomeText}>Welcome!</Text>
    </View>
  );
});

const headerStyles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
  },
  walletBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#F1F1F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletText: {
    fontSize: 18,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  closeBtn: {
    position: 'absolute',
    zIndex: 2,
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 18,
  },
});
