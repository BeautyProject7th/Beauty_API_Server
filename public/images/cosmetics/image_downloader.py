import urllib
import csv
import pandas as pd
import time
import os, sys

if __name__ == "__main__":
    print("Hello World")
    fields = ['brand', 'category_1', 'category_2', 'product_name', 'img_src']

    df = pd.read_csv('./naver_crawling_temp.csv', skipinitialspace=True, usecols=fields)
    col_length = df.size/5
    col = 0
    while col < 2974:
        if col % 10000 == 0 :
            path = "/home/ec2-user/mijeong/node/BeautyProject/public/images/cosmetics/" + str(col/10000)
            os.mkdir(path, 0755)
            os.chdir(path);
        # if col % 10000 == 0 :
        #     path = "/home/ec2-user/mijeong/node/BeautyProject/public/image/cosmetics"
        #     os.mkdir(path, col/10000)
        urllib.urlretrieve(df.img_src[col], "cosmetics_" + str(col) + ".jpg")
        #print str(col) + "/" + str(col_length)
        col+=1
        time.sleep(1)
